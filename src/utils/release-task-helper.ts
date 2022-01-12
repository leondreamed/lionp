import open from 'open';
import newGithubReleaseUrl from 'new-github-release-url';
import type { PackageJson } from 'type-fest';
import { getTagVersionPrefix, getPreReleasePrefix } from './util.js';
import { createVersion } from './version.js';
import type { LionpOptions } from '~/types/options.js';

export const releaseTaskHelper = async (
	options: LionpOptions,
	pkg: PackageJson
) => {
	const newVersion = createVersion(pkg.version!).getNewVersionFrom(
		options.version!
	)!;
	let tag = `${await getTagVersionPrefix(options)}${newVersion}`;
	const isPreRelease = createVersion(options.version!).isPrerelease();
	if (isPreRelease) {
		tag += await getPreReleasePrefix();
	}

	const url = newGithubReleaseUrl({
		repoUrl: options.repoUrl!,
		tag,
		body: options.releaseNotes(tag),
		isPrerelease: isPreRelease,
	});

	await open(url);
};
