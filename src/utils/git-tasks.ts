import { Listr } from 'listr2';
import Enquirer from 'enquirer';
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

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	return new Listr(tasks, { injectWrapper: { enquirer: Enquirer as any } });
};
