import * as path from 'node:path';

import { execa } from 'execa';
import { findUpSync } from 'find-up';
import { getBinaryPath } from 'npm-binary';

type CommitInfo = {
	id: string;
	message: string;
	group: string | null;
	scope: string | null;
	links: string[];
	conventional: boolean;
};

type GitCliffVersionContext = {
	version: string | null;
	commits: Array<{
		id: string;
		message: string;
		body: string | null;
		footers: string[];
		group:
			| 'Bug Fixes'
			| 'Styling'
			| 'Miscellaneous Tasks'
			| 'Features'
			| 'Testing'
			| 'Refactor';
		breaking_description: string | null;
		breaking: boolean;
		scope: string | null;
		links: string[];
		conventional: boolean;
	}>;
	commit_id: string | null;
	timestame: number;
	previous: {
		version: string | null;
		commits: Pick<
			CommitInfo,
			'id' | 'message' | 'group' | 'scope' | 'links' | 'conventional'
		>;
		commit_id: string;
		timestamp: number;
		previous: null;
	};
};

type GitCliffCommitsContext = GitCliffVersionContext[];

export async function genChangelog() {
	const gitCliffPath = getBinaryPath('git-cliff', import.meta.url);
	const gitDirectory = findUpSync('.git', { type: 'directory' });
	if (gitDirectory === undefined) {
		throw new Error('`.git` directory was not found for the project.');
	}

	const { stdout: commitsContextJson } = await execa(
		gitCliffPath,
		['--context'],
		{
			cwd: path.dirname(gitDirectory),
		}
	);

	const commitsContext = JSON.parse(
		commitsContextJson
	) as GitCliffCommitsContext;

	for (const _commit of commitsContext) {
		// TODO
	}

	return commitsContextJson;
}
