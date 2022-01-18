import { packageDirectory } from 'pkg-dir';
import { cosmiconfig } from 'cosmiconfig';
import isScoped from 'is-scoped';
import type { PackageJson } from 'type-fest';
import githubUrlFromGit from 'github-url-from-git';
import type { LionpConfig } from '~/types/config.js';

export async function getConfig(): Promise<Partial<LionpConfig>> {
	const searchDir = await packageDirectory();
	const searchPlaces = [
		'.np-config.json',
		'.np-config.js',
		'.np-config.cjs',
		'package.json',
	];
	const explorer = cosmiconfig('lionp', {
		searchPlaces,
		stopDir: searchDir,
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { config } = (await explorer.search(searchDir)) ?? {};

	return config as LionpConfig;
}

const defConfig = <C extends LionpConfig>(c: C) => c;
export function getDefaultConfig(pkg: PackageJson) {
	const extraBaseUrls = ['gitlab.com'];
	return defConfig({
		build: true,
		cleanup: true,
		publish: true,
		releaseDraft: true,
		releaseDraftOnly: false,
		preview: false,
		anyBranch: false,
		testScript: 'test',
		buildScript: 'build',
		publishScoped: isScoped(pkg.name!),
		'2fa': true,
		repoUrl:
			pkg.repository &&
			githubUrlFromGit((pkg.repository as { url: string }).url, {
				extraBaseUrls,
			}),
	});
}
