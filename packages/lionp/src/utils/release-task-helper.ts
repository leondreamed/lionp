import newGithubReleaseUrl from 'new-github-release-url';
import open from 'open';
import type { NormalizedPackageJson } from 'read-pkg-up';

import type { LionpOptions } from '~/types/options.js';
import { genChangelog } from '~/utils/changelog.js';

import { getPreReleasePrefix, getTagVersionPrefix } from './util.js';
import { createVersion } from './version.js';

export const releaseTaskHelper = async (
	options: LionpOptions,
	pkg: NormalizedPackageJson
) => {
	const newVersion = createVersion(pkg.version).getNewVersionFrom(
		options.version
	)!;
	let tag = `${await getTagVersionPrefix()}${newVersion}`;
	const isPreRelease = createVersion(options.version).isPrerelease();
	if (isPreRelease) {
		tag += await getPreReleasePrefix();
	}

	const changelog = await genChangelog();

	if (options.repoUrl !== undefined) {
		const url = newGithubReleaseUrl({
			repoUrl: options.repoUrl,
			tag,
			body: changelog,
			isPrerelease: isPreRelease,
		});

		await open(url);
	}
};
