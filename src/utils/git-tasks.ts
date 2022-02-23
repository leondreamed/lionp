import { Listr } from 'listr2';
import * as git from './git.js';
import type { LionpOptions } from '~/types/options.js';

export const gitTasks = (options: LionpOptions) => {
	const tasks = [
		{
			title: 'Check current branch',
			task: async () => git.verifyCurrentBranchIsReleaseBranch(options.branch),
		},
		{
			title: 'Check local working tree',
			task: async () => git.verifyWorkingTreeIsClean(),
		},
		{
			title: 'Check remote history',
			task: async () => git.verifyRemoteHistoryIsClean(),
		},
	];

	if (options.anyBranch) {
		tasks.shift();
	}

	return new Listr(tasks);
};
