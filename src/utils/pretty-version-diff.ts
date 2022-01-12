import chalk from 'chalk';
import type { ReleaseType } from 'semver';
import { createVersion } from './version.js';

export function prettyVersionDiff(oldVersion: string, inc: ReleaseType) {
	const newVersion = createVersion(oldVersion)
		.getNewVersionFrom(inc)!
		.split('.');
	const oldVersionArray = oldVersion.split('.');
	let firstVersionChange = false;
	const output = [];

	for (const [i, element] of newVersion.entries()) {
		if (element !== oldVersionArray[i] && !firstVersionChange) {
			output.push(`${chalk.dim.cyan(element)}`);
			firstVersionChange = true;
		} else if (element.indexOf('-') >= 1) {
			let preVersion = [];
			preVersion = element.split('-');
			output.push(`${chalk.dim.cyan(`${preVersion[0]!}-${preVersion[1]!}`)}`);
		} else {
			output.push(chalk.reset.dim(element));
		}
	}

	return output.join(chalk.reset.dim('.'));
}
