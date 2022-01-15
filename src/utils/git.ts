import type { ExecaError } from 'execa';
import { execa } from 'execa';
import escapeStringRegexp from 'escape-string-regexp';
import ignoreWalker from 'ignore-walk';
import { packageDirectorySync } from 'pkg-dir';
import { htmlEscape } from 'escape-goat';
import chalk from 'chalk';
import { verifyRequirementSatisfied } from './version.js';
import * as git from './git.js';
import * as util from './util.js';

export const latestTag = async () => {
	const { stdout } = await execa('git', ['describe', '--abbrev=0', '--tags']);
	return stdout;
};

export const newFilesSinceLastRelease = async () => {
	try {
		const { stdout } = await execa('git', [
			'diff',
			'--name-only',
			'--diff-filter=A',
			await latestTag(),
			'HEAD',
		]);
		if (stdout.trim().length === 0) {
			return [];
		}

		const result = stdout
			.trim()
			.split('\n')
			.map((row) => row.trim());
		return result;
	} catch {
		// Get all files under version control
		return ignoreWalker({
			path: packageDirectorySync(),
			ignoreFiles: ['.gitignore'],
		});
	}
};

const firstCommit = async () => {
	const { stdout } = await execa('git', [
		'rev-list',
		'--max-parents=0',
		'HEAD',
	]);
	return stdout;
};

export const previousTagOrFirstCommit = async () => {
	const tags = await tagList();

	if (tags.length === 0) {
		return;
	}

	if (tags.length === 1) {
		return firstCommit();
	}

	try {
		// Return the tag before the latest one.
		const latest = await latestTag();
		const index = tags.indexOf(latest);
		return tags[index - 1];
	} catch {
		// Fallback to the first commit.
		return firstCommit();
	}
};

export const latestTagOrFirstCommit = async () => {
	let latest;
	try {
		// In case a previous tag exists, we use it to compare the current repo status to.
		latest = await latestTag();
	} catch {
		// Otherwise, we fallback to using the first commit for comparison.
		latest = await firstCommit();
	}

	return latest;
};

export const getCurrentBranch = async () => {
	const { stdout } = await execa('git', ['symbolic-ref', '--short', 'HEAD']);
	return stdout;
};

export const hasUpstream = async () => {
	const escapedCurrentBranch = escapeStringRegexp(await getCurrentBranch());
	const { stdout } = await execa('git', [
		'status',
		'--short',
		'--branch',
		'--porcelain',
	]);

	return new RegExp(
		String.raw`^## ${escapedCurrentBranch}\.\.\..+\/${escapedCurrentBranch}`
	).test(stdout);
};

export const verifyCurrentBranchIsReleaseBranch = async (
	releaseBranch: string
) => {
	const currentBranch = await getCurrentBranch();
	if (currentBranch !== releaseBranch) {
		throw new Error(
			`Not on \`${releaseBranch}\` branch. Use --any-branch to publish anyway, or set a different release branch using --branch.`
		);
	}
};

export const tagList = async () => {
	// Returns the list of tags, sorted by creation date in ascending order.
	const { stdout } = await execa('git', ['tag', '--sort=creatordate']);
	return stdout.split('\n');
};

export const isHeadDetached = async () => {
	try {
		// Command will fail with code 1 if the HEAD is detached.
		await execa('git', ['symbolic-ref', '--quiet', 'HEAD']);
		return false;
	} catch {
		return true;
	}
};

export const isWorkingTreeClean = async () => {
	try {
		const { stdout: status } = await execa('git', ['status', '--porcelain']);
		if (status !== '') {
			return false;
		}

		return true;
	} catch {
		return false;
	}
};

export const verifyWorkingTreeIsClean = async () => {
	if (!(await isWorkingTreeClean())) {
		throw new Error('Unclean working tree. Commit or stash changes first.');
	}
};

export const isRemoteHistoryClean = async () => {
	let history;
	try {
		// Gracefully handle no remote set up.
		const { stdout } = await execa('git', [
			'rev-list',
			'--count',
			'--left-only',
			'@{u}...HEAD',
		]);
		history = stdout;
	} catch {}

	if (history && history !== '0') {
		return false;
	}

	return true;
};

export const verifyRemoteHistoryIsClean = async () => {
	if (!(await isRemoteHistoryClean())) {
		throw new Error('Remote history differs. Please pull changes.');
	}
};

export const verifyRemoteIsValid = async () => {
	try {
		await execa('git', ['ls-remote', 'origin', 'HEAD']);
	} catch (error: unknown) {
		const err = error as ExecaError;
		throw new Error(err.stderr.replace('fatal:', 'Git fatal error:'));
	}
};

export const fetch = async () => {
	await execa('git', ['fetch']);
};

export const tagExistsOnRemote = async (tagName: string) => {
	try {
		const { stdout: revInfo } = await execa('git', [
			'rev-parse',
			'--quiet',
			'--verify',
			`refs/tags/${tagName}`,
		]);

		if (revInfo) {
			return true;
		}

		return false;
	} catch (error: unknown) {
		const err = error as ExecaError;
		// Command fails with code 1 and no output if the tag does not exist, even though `--quiet` is provided
		// https://github.com/sindresorhus/np/pull/73#discussion_r72385685
		if (err.stdout === '' && err.stderr === '') {
			return false;
		}

		throw error;
	}
};

async function hasLocalBranch(branch: string) {
	try {
		await execa('git', [
			'show-ref',
			'--verify',
			'--quiet',
			`refs/heads/${branch}`,
		]);
		return true;
	} catch {
		return false;
	}
}

export const defaultBranch = async () => {
	for (const branch of ['main', 'master', 'gh-pages']) {
		// eslint-disable-next-line no-await-in-loop
		if (await hasLocalBranch(branch)) {
			return branch;
		}
	}

	throw new Error(
		'Could not infer the default Git branch. Please specify one with the --branch flag or with a np config.'
	);
};

export const verifyTagDoesNotExistOnRemote = async (tagName: string) => {
	if (await tagExistsOnRemote(tagName)) {
		throw new Error(`Git tag \`${tagName}\` already exists.`);
	}
};

export const commitLogFromRevision = async (revision: string) => {
	const { stdout } = await execa('git', [
		'log',
		'--format=%s %h',
		`${revision}..HEAD`,
	]);
	return stdout;
};

export const pushGraceful = async (remoteIsOnGitHub: boolean) => {
	try {
		await gitPush();
	} catch (error: unknown) {
		const err = error as ExecaError;
		if (remoteIsOnGitHub && err.stderr && err.stderr.includes('GH006')) {
			// Try to push tags only, when commits can't be pushed due to branch protection
			await execa('git', ['push', '--tags']);
			return {
				pushed: 'tags',
				reason:
					'Branch protection: np can`t push the commits. Push them manually.',
			};
		}

		throw error;
	}
};

export const gitPush = async () => {
	await execa('git', ['push', '--follow-tags']);
};

export const deleteTag = async (tagName: string) => {
	await execa('git', ['tag', '--delete', tagName]);
};

export const removeLastCommit = async () => {
	await execa('git', ['reset', '--hard', 'HEAD~1']);
};

const gitVersion = async () => {
	const { stdout } = await execa('git', ['version']);
	const match = /git version (?<version>\d+\.\d+\.\d+).*/.exec(stdout);
	return match?.groups?.version;
};

export const verifyRecentGitVersion = async () => {
	const installedVersion = await gitVersion();

	verifyRequirementSatisfied('git', installedVersion!);
};

export const checkIfFileGitIgnored = async (pathToFile: string) => {
	try {
		const { stdout } = await execa('git', ['check-ignore', pathToFile]);
		return Boolean(stdout);
	} catch (error: unknown) {
		const err = error as ExecaError;
		// If file is not ignored, `git check-ignore` throws an empty error and exits.
		// Check that and return false so as not to throw an unwanted error.
		if (err.stdout === '' && err.stderr === '') {
			return false;
		}

		throw error;
	}
};

export async function printCommitLog(
	repoUrl: string,
	registryUrl: string,
	fromLatestTag: boolean,
	releaseBranch: string
) {
	const revision = fromLatestTag
		? await git.latestTagOrFirstCommit()
		: await git.previousTagOrFirstCommit();
	if (!revision) {
		throw new Error('The package has not been published yet.');
	}

	const log = await git.commitLogFromRevision(revision);

	if (!log) {
		return {
			hasCommits: false,
			hasUnreleasedCommits: false,
			releaseNotes: () => {
				/* Noop */
			},
		};
	}

	let hasUnreleasedCommits = false;
	let commitRangeText = `${revision}...${releaseBranch}`;

	let commits = log.split('\n').map((commit) => {
		const splitIndex = commit.lastIndexOf(' ');
		return {
			message: commit.slice(0, splitIndex),
			id: commit.slice(splitIndex + 1),
		};
	});

	if (!fromLatestTag) {
		const latestTag = await git.latestTag();

		// Version bump commit created by np, following the semver specification.
		const versionBumpCommitName =
			/v\d+\.\d+\.\d+/.exec(latestTag) && latestTag.slice(1); // Name v1.0.1 becomes 1.0.1
		const versionBumpCommitIndex = commits.findIndex(
			(commit) => commit.message === versionBumpCommitName
		);

		if (versionBumpCommitIndex > 0) {
			commitRangeText = `${revision}...${latestTag}`;
			hasUnreleasedCommits = true;
		}

		if (await git.isHeadDetached()) {
			commitRangeText = `${revision}...${latestTag}`;
		}

		// Get rid of unreleased commits and of the version bump commit.
		commits = commits.slice(versionBumpCommitIndex + 1);
	}

	const history = commits
		.map((commit) => {
			const commitMessage = util.linkifyIssues(repoUrl, commit.message);
			const commitId = util.linkifyCommit(repoUrl, commit.id);
			return `- ${commitMessage}  ${commitId}`;
		})
		.join('\n');

	const releaseNotes = (nextTag: string) =>
		commits
			.map((commit) => `- ${htmlEscape(commit.message)}  ${commit.id}`)
			.join('\n') + `\n\n${repoUrl}/compare/${revision}...${nextTag}`;

	const commitRange = util.linkifyCommitRange(repoUrl, commitRangeText);
	console.log(
		`${chalk.bold('Commits:')}\n${history}\n\n${chalk.bold(
			'Commit Range:'
		)}\n${commitRange}\n\n${chalk.bold('Registry:')}\n${registryUrl}\n`
	);

	return {
		hasCommits: true,
		hasUnreleasedCommits,
		releaseNotes,
	};
}
