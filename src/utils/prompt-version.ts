import inquirer from 'inquirer';
import type { ReleaseType } from 'semver';
import type { PackageJson } from 'type-fest';
import githubUrlFromGit from 'github-url-from-git';
import { prereleaseTags } from './npm/index.js';
import { prettyVersionDiff } from './pretty-version-diff.js';
import {
	isPrereleaseOrIncrement,
	createVersion,
	isValidInput,
	SEMVER_INCREMENTS,
	validate,
} from './version.js';

export async function promptVersion(options: any, pkg: PackageJson) {
	const oldVersion = pkg.version!;
	validate(oldVersion);

	const extraBaseUrls = ['gitlab.com'];
	const repoUrl =
		pkg.repository &&
		githubUrlFromGit((pkg.repository as { url: string }).url, {
			extraBaseUrls,
		});

	const prompts = [
		{
			type: 'list',
			name: 'version',
			message: 'Select semver increment or specify new version',
			pageSize: SEMVER_INCREMENTS.length + 2,
			choices: [
				...SEMVER_INCREMENTS.map((inc) => ({
					name: `${inc} 	${prettyVersionDiff(oldVersion, inc)}`,
					value: inc,
				})),
				new inquirer.Separator(),
				{
					name: 'Other (specify)',
					value: null,
				},
			],
			filter: (input: ReleaseType) =>
				isValidInput(input)
					? createVersion(oldVersion).getNewVersionFrom(input)
					: input,
		},
		{
			type: 'input',
			name: 'customVersion',
			message: 'Version',
			when: (answers: { version: string }) => !answers.version,
			filter: (input: ReleaseType) =>
				isValidInput(input)
					? createVersion(oldVersion).getNewVersionFrom(input)
					: input,
			validate: (input: string) => {
				if (!isValidInput(input)) {
					return 'Please specify a valid semver, for example, `1.2.3`. See https://semver.org';
				}

				if (createVersion(oldVersion).isLowerThanOrEqualTo(input)) {
					return `Version must be greater than ${oldVersion}`;
				}

				return true;
			},
		},
		{
			type: 'list',
			name: 'tag',
			message: 'How should this pre-release version be tagged in npm?',
			when: (answers: { customVersion: string; version: string }) =>
				(isPrereleaseOrIncrement(answers.customVersion) ||
					isPrereleaseOrIncrement(answers.version)) &&
				!options.tag,
			choices: async () => {
				const existingPrereleaseTags = await prereleaseTags(pkg.name!);

				return [
					...existingPrereleaseTags,
					new inquirer.Separator(),
					{
						name: 'Other (specify)',
						value: null,
					},
				];
			},
		},
		{
			type: 'input',
			name: 'customTag',
			message: 'Tag',
			when: (answers: { customVersion: string; version: string }) =>
				(isPrereleaseOrIncrement(answers.customVersion) ||
					isPrereleaseOrIncrement(answers.version)) &&
				!options.tag,
			validate: (input: string) => {
				if (input.length === 0) {
					return 'Please specify a tag, for example, `next`.';
				}

				if (input.toLowerCase() === 'latest') {
					return "It's not possible to publish pre-releases under the `latest` tag. Please specify something else, for example, `next`.";
				}

				return true;
			},
		},
	];

	const answers = await inquirer.prompt(prompts);

	return {
		version: answers.version || answers.customVersion,
		confirm: true,
		repoUrl,
	};
}
