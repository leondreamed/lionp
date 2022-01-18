import { readPackageUpSync } from 'read-pkg-up';
import issueRegex from 'issue-regex';
import terminalLink from 'terminal-link';
import pMemoize from 'p-memoize';
import { packageDirectorySync } from 'pkg-dir';
import { execa } from 'execa';
import type { PackageJson } from 'type-fest';
import * as git from './git.js';
import * as npm from './npm/index.js';

export const readPkg = (packagePath?: string) => {
	const fullPackagePath = packagePath
		? packageDirectorySync({ cwd: packagePath })
		: packageDirectorySync();

	if (!fullPackagePath) {
		throw new Error(
			'No `package.json` found. Make sure the current directory is a valid package.'
		);
	}

	const { packageJson } = readPackageUpSync({
		cwd: fullPackagePath,
	})!;

	return packageJson;
};

export const linkifyIssues = (url: string | undefined, message: string) => {
	if (!(url && terminalLink.isSupported)) {
		return message;
	}

	return message.replace(issueRegex(), (issue) => {
		const issuePart = issue.replace('#', '/issues/');

		if (issue.startsWith('#')) {
			return terminalLink(issue, `${url}${issuePart}`);
		}

		return terminalLink(issue, `https://github.com/${issuePart}`);
	});
};

export const linkifyCommit = (url: string | undefined, commit: string) => {
	if (!(url && terminalLink.isSupported)) {
		return commit;
	}

	return terminalLink(commit, `${url}/commit/${commit}`);
};

export const linkifyCommitRange = (
	url: string | undefined,
	commitRange: string
) => {
	if (!(url && terminalLink.isSupported)) {
		return commitRange;
	}

	return terminalLink(commitRange, `${url}/compare/${commitRange}`);
};

export const getTagVersionPrefix = pMemoize(async () => {
	try {
		const { stdout } = await execa('pnpm', [
			'config',
			'get',
			'tag-version-prefix',
		]);
		return stdout;
	} catch {
		return 'v';
	}
});

export const getNewFiles = async (pkg: PackageJson) => {
	const listNewFiles = await git.newFilesSinceLastRelease();
	return {
		unpublished: await npm.getNewAndUnpublishedFiles(pkg, listNewFiles),
		firstTime: await npm.getFirstTimePublishedFiles(pkg, listNewFiles),
	};
};

export const getPreReleasePrefix = pMemoize(async () => {
	try {
		const { stdout } = await execa('pnpm', ['config', 'get', 'preId']);
		if (stdout !== 'undefined') {
			return stdout;
		}

		return '';
	} catch {
		return '';
	}
});
