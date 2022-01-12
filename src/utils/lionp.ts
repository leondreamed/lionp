import * as fs from 'node:fs';
import * as path from 'node:path';
import { Listr } from 'listr2';
import type { ExecaError } from 'execa';
import { execa } from 'execa';
import hostedGitInfo from 'hosted-git-info';
import { packageDirectorySync } from 'pkg-dir';
import onetime from 'onetime';
import exitHook from 'async-exit-hook';
import { catchError, finalize } from 'rxjs';
import del from 'del';
import logSymbols from 'log-symbols';
import { readPackageUp } from 'read-pkg-up';
import * as npm from './npm/index.js';
import { getTagVersionPrefix, readPkg } from './util.js';
import * as git from './git.js';
import { prerequisiteTasks } from './prerequisite-tasks.js';
import { gitTasks } from './git-tasks.js';
import { getPackagePublishArguments, publish } from './npm/publish.js';
import { releaseTaskHelper } from './release-task-helper.js';
import { enable2fa, getEnable2faArgs } from './npm/index.js';
import type { LionpOptions } from '~/types/options.js';

// eslint-disable-next-line @typescript-eslint/default-param-last
export async function lionp(input = 'patch', options: LionpOptions) {
	const pkg = readPkg(options.contents);
	const testScript = options.testScript ?? 'test';
	const runCleanup = options.cleanup;
	const runTests = options.tests;
	const rootDir = packageDirectorySync();
	const pkgManager = 'pnpm';
	const pkgManagerName = 'pnpm';
	const hasLockFile = fs.existsSync(path.resolve(rootDir, 'pnpm-lock.yaml'));
	const isOnGitHub =
		options.repoUrl === undefined
			? false
			: (hostedGitInfo.fromUrl(options.repoUrl) ?? {}).type === 'github';
	const testCommand = options.testScript ? ['run', testScript] : [testScript];
	let publishStatus = 'UNKNOWN';
	let pushedObjects: { pushed: string; reason: string } | undefined;

	const rollback = onetime(async () => {
		console.log('\nPublish failed. Rolling back to the previous state…');

		const tagVersionPrefix = await getTagVersionPrefix();

		const latestTag = await git.latestTag();
		const versionInLatestTag = latestTag.slice(tagVersionPrefix.length);

		try {
			if (
				versionInLatestTag === readPkg().version &&
				versionInLatestTag !== pkg.version
			) {
				// Verify that the package's version has been bumped before deleting the last tag and commit.
				await git.deleteTag(latestTag);
				await git.removeLastCommit();
			}

			console.log(
				'Successfully rolled back the project to its previous state.'
			);
		} catch (error: unknown) {
			const err = String(error);
			console.log(`Couldn't roll back because of the following error:\n${err}`);
		}
	});

	// The default parameter is a workaround for https://github.com/Tapppi/async-exit-hook/issues/9
	exitHook(
		(
			callback = () => {
				/* Noop */
			}
		) => {
			if (options.preview) {
				callback();
			} else if (publishStatus === 'FAILED') {
				(async () => {
					await rollback();
					callback();
				})();
			} else if (publishStatus === 'SUCCESS') {
				callback();
			} else {
				console.log('\nAborted!');
				callback();
			}
		}
	);

	const tasks = new Listr(
		[
			{
				title: 'Prerequisite check',
				enabled: () => options.runPublish!,
				task: () => prerequisiteTasks(input, pkg, options),
			},
			{
				title: 'Git',
				task: () => gitTasks(options),
			},
		],
		{
			rendererOptions: {
				showSubtasks: false,
			},
		}
	);

	tasks.add([]);

	if (runCleanup) {
		tasks.add([
			{
				title: 'Cleanup',
				enabled: () => !hasLockFile,
				task: async () => del('node_modules'),
			},
			{
				title: 'Installing dependencies using pnpm',
				task: async () => {
					await execa('pnpm', [
						'install',
						'--frozen-lockfile',
						'--production=false',
					]);
				},
			},
		]);
	}

	if (runTests) {
		tasks.add([
			{
				title: 'Running tests using pnpm',
				task: async () => {
					await execa('pnpm', testCommand);
				},
			},
		]);
	}

	tasks.add([
		{
			title: 'Bumping version using pnpm',
			skip: () => {
				if (options.preview) {
					let previewText = `[Preview] Command not executed: npm version ${input}`;

					if (options.message) {
						previewText += ` --message '${options.message.replace(
							/%s/g,
							input
						)}'`;
					}

					return `${previewText}.`;
				}

				return false;
			},
			task: () => {
				const args = ['version', input];

				if (options.message) {
					args.push('--message', options.message);
				}

				return execa('pnpm', args);
			},
		},
	]);

	if (options.runPublish) {
		tasks.add([
			{
				title: `Publishing package using ${pkgManagerName}`,
				skip: () => {
					if (options.preview) {
						const args = getPackagePublishArguments(options);
						return `[Preview] Command not executed: ${pkgManager} ${args.join(
							' '
						)}.`;
					}

					return false;
				},
				task: (context, task) => {
					let hasError = false;

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return publish(context, pkgManager, task, options).pipe(
						catchError(async (error: ExecaError) => {
							hasError = true;
							await rollback();
							throw new Error(
								`Error publishing package:\n${error.message}\n\nThe project was rolled back to its previous state.`
							);
						}),
						finalize(() => {
							publishStatus = hasError ? 'FAILED' : 'SUCCESS';
						})
					) as any;
				},
			},
		]);

		const isExternalRegistry = npm.isExternalRegistry(pkg);
		if (
			options['2fa'] &&
			options.availability?.isAvailable &&
			!options.availability?.isUnknown &&
			!pkg.private &&
			!isExternalRegistry
		) {
			tasks.add([
				{
					title: 'Enabling two-factor authentication',
					skip: () => {
						if (options.preview) {
							const args = getEnable2faArgs(pkg.name, options);
							return `[Preview] Command not executed: npm ${args.join(' ')}.`;
						}

						return false;
					},
					task: (context, task) =>
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
						enable2fa(task, pkg.name, { otp: context.otp as string }) as any,
				},
			]);
		}
	} else {
		publishStatus = 'SUCCESS';
	}

	tasks.add({
		title: 'Pushing tags',
		skip: async () => {
			if (!(await git.hasUpstream())) {
				return 'Upstream branch not found; not pushing.';
			}

			if (options.preview) {
				return '[Preview] Command not executed: git push --follow-tags.';
			}

			if (publishStatus === 'FAILED' && options.runPublish) {
				return "Couldn't publish package to npm; not pushing.";
			}

			return false;
		},
		task: async () => {
			pushedObjects = await git.pushGraceful(isOnGitHub);
		},
	});

	if (options.releaseDraft) {
		tasks.add({
			title: 'Creating release draft on GitHub',
			enabled: () => isOnGitHub,
			skip: () => {
				if (options.preview) {
					return '[Preview] GitHub Releases draft will not be opened in preview mode.';
				}

				return false;
			},
			task: async () => releaseTaskHelper(options, pkg),
		});
	}

	await tasks.run();

	if (pushedObjects) {
		console.error(`\n${logSymbols.error} ${pushedObjects.reason}`);
	}

	const { packageJson: newPkg } = (await readPackageUp())!;

	return newPkg;
}
