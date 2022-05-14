import Enquirer from 'enquirer';
import { Listr } from 'listr2';
import process from 'node:process';
import type { ReleaseType } from 'semver';
import type { PackageJson } from 'type-fest';

import type { LionpOptions } from '~/types/options';

import * as git from './git.js';
import * as npm from './npm/index.js';
import { getTagVersionPrefix } from './util.js';
import { createVersion, getSemverIncrements, isValidInput } from './version.js';

export const prerequisiteTasks = (
	input: string,
	pkg: PackageJson,
	options: LionpOptions
) => {
	const isExternalRegistry = npm.isExternalRegistry(pkg);
	let newVersion: string | undefined;

	const tasks = [
		{
			title: 'Check publishConfig option',
			task() {
				if (
					pkg.publishConfig === undefined ||
					!('directory' in pkg.publishConfig)
				) {
					throw new Error(
						'publishConfig.directory must be specified in your package.json file.'
					);
				}
			},
		},
		{
			title: 'Ping npm registry',
			enabled: () => !pkg.private && !isExternalRegistry,
			task: async () => npm.checkConnection(),
		},
		{
			title: 'Check npm version',
			task: async () => npm.verifyRecentNpmVersion(),
		},
		{
			title: 'Verify user is authenticated',
			enabled: () => process.env.NODE_ENV !== 'test' && !pkg.private,
			async task() {
				const username = await npm.username({
					externalRegistry: isExternalRegistry
						? pkg.publishConfig?.registry
						: false,
				});

				const collaborators = await npm.collaborators(pkg);
				if (!collaborators) {
					return;
				}

				const json = JSON.parse(collaborators) as Record<string, unknown[]>;
				const permissions = json[username];
				if (!permissions || !permissions.includes('write')) {
					throw new Error(
						'You do not have write permissions required to publish this package.'
					);
				}
			},
		},
		{
			title: 'Check git version',
			task: async () => git.verifyRecentGitVersion(),
		},
		{
			title: 'Check git remote',
			task: async () => git.verifyRemoteIsValid(),
		},
		{
			title: 'Validate version',
			task() {
				if (!isValidInput(input)) {
					throw new Error(
						`Version should be either ${getSemverIncrements().join(
							', '
						)}, or a valid semver version.`
					);
				}

				newVersion =
					createVersion(pkg.version!).getNewVersionFrom(input as ReleaseType) ??
					undefined;

				if (createVersion(pkg.version!).isLowerThanOrEqualTo(newVersion!)) {
					throw new Error(
						`New version \`${newVersion!}\` should be higher than current version \`${pkg.version!}\``
					);
				}
			},
		},
		{
			title: 'Check for pre-release version',
			task() {
				if (
					!pkg.private &&
					createVersion(newVersion!).isPrerelease() &&
					!options.tag
				) {
					throw new Error(
						'You must specify a dist-tag using --tag when publishing a pre-release version. This prevents accidentally tagging unstable versions as "latest". https://docs.npmjs.com/cli/dist-tag'
					);
				}
			},
		},
		{
			title: 'Check git tag existence',
			async task() {
				await git.fetch();

				const tagPrefix = await getTagVersionPrefix();

				await git.verifyTagDoesNotExistOnRemote(`${tagPrefix}${newVersion!}`);
			},
		},
	];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	return new Listr(tasks, { injectWrapper: { enquirer: Enquirer as any } });
};
