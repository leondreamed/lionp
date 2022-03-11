import * as fs from 'node:fs';
import * as path from 'node:path';
import { Listr } from 'listr2';
import type { ExecaError } from 'execa';
import { execa } from 'execa';
import hostedGitInfo from 'hosted-git-info';
import { packageDirectorySync } from 'pkg-dir';
import onetime from 'onetime';
import exitHook from 'async-exit-hook';
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

export async function lionp(options: LionpOptions) {
	const pkg = readPkg();
	const {
		version,
		testScript,
		buildScript,
		tests: runTests,
		cleanup: runCleanup,
	} = options;
	const rootDir = packageDirectorySync();
	const pkgManager = 'pnpm';
	const pkgManagerName = 'pnpm';
	const hasLockFile = fs.existsSync(path.resolve(rootDir, 'pnpm-lock.yaml'));
	const isOnGitHub =
		options.repoUrl === undefined
			? false
			: (hostedGitInfo.fromUrl(options.repoUrl) ?? {}).type === 'github';
	const testCommand = ['run', testScript];
	const buildCommand = ['run', buildScript];
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

	const tasks = new Listr<{ otp: string }>(
		[
			{
				title: 'Prerequisite check',
				enabled: () => options.runPublish,
				task: () => prerequisiteTasks(version, pkg, options),
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

	if (runCleanup) {
		tasks.add([
			{
				title: 'Cleanup',
				enabled: () => !hasLockFile,
				task: async () => del('node_modules'),
			},
			{
				title: 'Installing dependencies using pnpm',
				async task() {
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
				async task() {
					await execa('pnpm', testCommand);
				},
			},
		]);
	}

	tasks.add([
		{
			title: 'Bumping version using pnpm',
			skip() {
				if (options.preview) {
					let previewText = `[Preview] Command not executed: npm version ${version}`;

					if (options.message) {
						previewText += ` --message '${options.message.replace(
							/%s/g,
							version
						)}'`;
					}

					return `${previewText}.`;
				}

				return false;
			},
			task() {
				const args = ['version', version];

				if (options.message) {
					args.push('--message', options.message);
				}

				return execa('pnpm', args);
			},
		},
	]);

	if (options.runBuild) {
		tasks.add([
			{
				title: 'Running build using pnpm',
				async task() {
					try {
						await execa('pnpm', buildCommand);
					} catch (error: unknown) {
						const err = error as ExecaError;
						await rollback();
						throw new Error(
							`Error: Build failed: ${err.message}; the project was rolled back to its previous state.`
						);
					}
				},
			},
		]);
	}

	if (options.runPublish) {
		tasks.add([
			{
				title: `Publishing package using ${pkgManagerName}`,
				skip() {
					if (options.preview) {
						const args = getPackagePublishArguments(options);
						return `[Preview] Command not executed: ${pkgManager} ${args.join(
							' '
						)}.`;
					}

					return false;
				},
				async task(context, task) {
					let hasError = false;

					try {
						await publish(context, pkgManager, task, options);
					} catch (error: unknown) {
						const err = error as ExecaError;
						hasError = true;
						await rollback();
						throw new Error(
							`Error publishing package:\n${err.message}\n\nThe project was rolled back to its previous state.`
						);
					}

					publishStatus = hasError ? 'FAILED' : 'SUCCESS';
				},
			},
		]);

		const isExternalRegistry = npm.isExternalRegistry(pkg);
		if (
			options['2fa'] &&
			options.availability.isAvailable &&
			!options.availability.isUnknown &&
			!pkg.private &&
			!isExternalRegistry
		) {
			tasks.add([
				{
					title: 'Enabling two-factor authentication',
					skip(context) {
						if (options.preview) {
							const args = getEnable2faArgs(pkg.name, {
								...options,
								otp: context.otp,
							});
							return `[Preview] Command not executed: npm ${args.join(' ')}.`;
						}

						return false;
					},
					task: async (context, task) =>
						enable2fa(task, pkg.name, { otp: context.otp }),
				},
			]);
		}
	} else {
		publishStatus = 'SUCCESS';
	}

	tasks.add({
		title: 'Pushing tags',
		async skip() {
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
		async task() {
			pushedObjects = await git.pushGraceful(isOnGitHub);
		},
	});

	if (options.releaseDraft) {
		tasks.add({
			title: 'Creating release draft on GitHub',
			enabled: () => isOnGitHub,
			skip() {
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
