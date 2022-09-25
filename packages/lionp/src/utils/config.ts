import { cosmiconfig } from 'cosmiconfig';
import githubUrlFromGit from 'github-url-from-git';
import isScoped from 'is-scoped';
import { packageDirectory } from 'pkg-dir';
import type { NormalizedPackageJson } from 'read-pkg-up';

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
export function getDefaultConfig(pkg: NormalizedPackageJson) {
	const extraBaseUrls = ['gitlab.com'];

	const repoUrl =
		pkg.repository === undefined
			? undefined
			: githubUrlFromGit((pkg.repository as { url: string }).url, {
					extraBaseUrls,
			  });

	return defConfig({
		build: true,
		cleanup: true,
		publish: true,
		tests: true,
		releaseDraft: true,
		releaseDraftOnly: false,
		preview: false,
		anyBranch: false,
		testScript: 'test',
		buildScript: 'build',
		publishScoped: isScoped(pkg.name),
		'2fa': false,
		repoUrl,
	});
}
