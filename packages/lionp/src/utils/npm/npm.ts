import * as fs from 'node:fs';
import * as path from 'node:path';

import chalk from 'chalk';
import type { ExecaError } from 'execa';
import { execa } from 'execa';
import ignoreWalker from 'ignore-walk';
import minimatch from 'minimatch';
import type * as normalize from 'normalize-package-data';
import type { Options } from 'npm-name';
import npmName from 'npm-name';
import pTimeout from 'p-timeout';
import { packageDirectorySync } from 'pkg-dir';
import type { NormalizedPackageJson } from 'read-pkg-up';
import type { PackageJson } from 'type-fest';

import { verifyRequirementSatisfied } from '../version.js';

export const isExternalRegistry = (
	pkg: NormalizedPackageJson
): pkg is PackageJson &
	normalize.Package & { publishConfig: { registry: string } } =>
	typeof pkg.publishConfig === 'object' &&
	typeof pkg.publishConfig.registry === 'string';

// According to https://docs.npmjs.com/files/package.json#files
// npm's default behavior is to ignore these files.
const filesIgnoredByDefault = [
	'.*.swp',
	'.npmignore',
	'.gitignore',
	'._*',
	'.DS_Store',
	'.hg',
	'.npmrc',
	'.lock-wscript',
	'.svn',
	'.wafpickle-N',
	'*.orig',
	'config.gypi',
	'CVS',
	'node_modules/**/*',
	'npm-debug.log',
	'package-lock.json',
	'.git/**/*',
	'.git',
];

export const checkConnection = async () =>
	pTimeout(
		(async () => {
			try {
				await execa('npm', ['ping']);
				return true;
			} catch {
				throw new Error('Connection to npm registry failed');
			}
		})(),
		{
			milliseconds: 15_000,
			message: 'Connection to npm registry timed out',
		}
	);

export const username = async ({
	externalRegistry,
}: {
	externalRegistry: undefined | string | false;
}) => {
	const args = ['whoami'];

	if (externalRegistry !== undefined && externalRegistry !== false) {
		args.push('--registry', externalRegistry);
	}

	try {
		const { stdout } = await execa('npm', args);
		return stdout;
	} catch (error: unknown) {
		const err = error as ExecaError;
		throw new Error(
			err.stderr.includes('ENEEDAUTH')
				? 'You must be logged in. Use `npm login` and try again.'
				: 'Authentication error. Use `npm whoami` to troubleshoot.'
		);
	}
};

export const collaborators = async (pkg: NormalizedPackageJson) => {
	const packageName = pkg.name;
	if (typeof packageName !== 'string') {
		throw new TypeError('package name must be a string');
	}

	const args = ['access', 'ls-collaborators', packageName];
	if (isExternalRegistry(pkg)) {
		args.push('--registry', pkg.publishConfig.registry);
	}

	try {
		const { stdout } = await execa('npm', args);
		return stdout;
	} catch (error: unknown) {
		const err = error as ExecaError;
		// Ignore non-existing package error
		if (err.stderr.includes('code E404')) {
			return false;
		}

		throw error;
	}
};

export const prereleaseTags = async (packageName: string) => {
	if (typeof packageName !== 'string') {
		throw new TypeError('package name must be a string');
	}

	let tags: string[] = [];
	try {
		const { stdout } = await execa('npm', [
			'view',
			'--json',
			packageName,
			'dist-tags',
		]);
		tags = Object.keys(JSON.parse(stdout)).filter((tag) => tag !== 'latest');
	} catch (error: unknown) {
		const err = error as ExecaError;
		if (JSON.parse(err.stdout)?.error?.code !== 'E404') {
			throw error;
		}
	}

	if (tags.length === 0) {
		tags.push('next');
	}

	return tags;
};

export const isPackageNameAvailable = async (pkg: NormalizedPackageJson) => {
	const args: unknown[] = [pkg.name];
	const availability = {
		isAvailable: false,
		isUnknown: false,
	};

	if (isExternalRegistry(pkg)) {
		args.push({
			registryUrl: pkg.publishConfig.registry,
		});
	}

	try {
		availability.isAvailable =
			(await npmName(...(args as [string, Options]))) || false;
	} catch {
		availability.isUnknown = true;
	}

	return availability;
};

export const getNpmVersion = async () => {
	const { stdout } = await execa('npm', ['--version']);
	return stdout;
};

export const verifyRecentNpmVersion = async () => {
	const npmVersion = await getNpmVersion();
	verifyRequirementSatisfied('npm', npmVersion);
};

export const checkIgnoreStrategy = ({
	files,
}: {
	files: string[] | undefined;
}) => {
	if (!files && !npmignoreExistsInPackageRootDir()) {
		console.log(`
		\n${chalk.bold.yellow('Warning:')} No ${chalk.bold.cyan(
			'files'
		)} field specified in ${chalk.bold.magenta(
			'package.json'
		)} nor is a ${chalk.bold.magenta(
			'.npmignore'
		)} file present. Having one of those will prevent you from accidentally publishing development-specific files along with your package's source code to npm.
		`);
	}
};

function npmignoreExistsInPackageRootDir() {
	const rootDir = packageDirectorySync();
	return fs.existsSync(path.resolve(rootDir!, '.npmignore'));
}

function excludeGitAndNodeModulesPaths(singlePath: string) {
	return (
		!singlePath.startsWith('.git/') && !singlePath.startsWith('node_modules/')
	);
}

async function getFilesIgnoredByDotnpmignore(
	pkg: NormalizedPackageJson,
	fileList: string[]
) {
	let allowList = await ignoreWalker({
		path: packageDirectorySync(),
		ignoreFiles: ['.npmignore'],
	});
	allowList = allowList.filter((singlePath) =>
		excludeGitAndNodeModulesPaths(singlePath)
	);
	return fileList.filter(
		minimatch.filter(getIgnoredFilesGlob(allowList, pkg.directories), {
			matchBase: true,
			dot: true,
		})
	);
}

function filterFileList(globArray: string[], fileList: string[]) {
	if (globArray.length === 0) {
		return [];
	}

	const globString =
		globArray.length > 1
			? `{${globArray
					.filter((singlePath) => excludeGitAndNodeModulesPaths(singlePath))
					.join(',')}}`
			: globArray[0]!;

	return fileList.filter(
		// eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
		minimatch.filter(globString, { matchBase: true, dot: true })
	);
}

async function getFilesIncludedByDotnpmignore(
	pkg: NormalizedPackageJson,
	fileList: string[]
) {
	const allowList = await ignoreWalker({
		path: packageDirectorySync(),
		ignoreFiles: ['.npmignore'],
	});
	return filterFileList(allowList, fileList);
}

function getFilesNotIncludedInFilesProperty(
	pkg: NormalizedPackageJson,
	fileList: string[]
) {
	const globArrayForFilesAndDirectories = [...pkg.files!];
	const rootDir = packageDirectorySync();
	for (const glob of pkg.files!) {
		try {
			if (fs.statSync(path.resolve(rootDir!, glob)).isDirectory()) {
				globArrayForFilesAndDirectories.push(`${glob}/**/*`);
			}
		} catch {}
	}

	const result = fileList.filter(
		minimatch.filter(
			getIgnoredFilesGlob(globArrayForFilesAndDirectories, pkg.directories),
			{ matchBase: true, dot: true }
		)
	);
	return result.filter(
		minimatch.filter(getDefaultIncludedFilesGlob(pkg.main!), {
			nocase: true,
			matchBase: true,
		})
	);
}

function getFilesIncludedInFilesProperty(
	pkg: NormalizedPackageJson,
	fileList: string[]
) {
	const globArrayForFilesAndDirectories = [...pkg.files!];
	const rootDir = packageDirectorySync();
	for (const glob of pkg.files!) {
		try {
			if (fs.statSync(path.resolve(rootDir!, glob)).isDirectory()) {
				globArrayForFilesAndDirectories.push(`${glob}/**/*`);
			}
		} catch {}
	}

	return filterFileList(globArrayForFilesAndDirectories, fileList);
}

function getDefaultIncludedFilesGlob(mainFile: string) {
	// According to https://docs.npmjs.com/files/package.json#files
	// npm's default behavior is to always include these files.
	const filesAlwaysIncluded = [
		'package.json',
		'README*',
		'CHANGES*',
		'CHANGELOG*',
		'HISTORY*',
		'LICENSE*',
		'LICENCE*',
		'NOTICE*',
	];
	if (mainFile) {
		filesAlwaysIncluded.push(mainFile);
	}

	return `!{${filesAlwaysIncluded.join(',')}}`;
}

function getIgnoredFilesGlob(
	globArrayFromFilesProperty: string[],
	packageDirectories: NormalizedPackageJson['directories'] | undefined
) {
	// Test files are assumed not to be part of the package
	let testDirectoriesGlob = '';
	if (packageDirectories && Array.isArray(packageDirectories.test)) {
		testDirectoriesGlob = packageDirectories.test.join(',');
	} else if (
		packageDirectories &&
		typeof packageDirectories.test === 'string'
	) {
		testDirectoriesGlob = packageDirectories.test;
	} else {
		// Fallback to `test` directory
		testDirectoriesGlob = 'test/**/*';
	}

	return `!{${globArrayFromFilesProperty.join(
		','
	)},${filesIgnoredByDefault.join(',')},${testDirectoriesGlob}}`;
}

// Get all files which will be ignored by either `.npmignore` or the `files` property in `package.json` (if defined).
export const getNewAndUnpublishedFiles = async (
	pkg: NormalizedPackageJson,
	newFiles: string[] = []
) => {
	if (pkg.files) {
		return getFilesNotIncludedInFilesProperty(pkg, newFiles);
	}

	if (npmignoreExistsInPackageRootDir()) {
		return getFilesIgnoredByDotnpmignore(pkg, newFiles);
	}

	return [];
};

export const getFirstTimePublishedFiles = async (
	pkg: NormalizedPackageJson,
	newFiles: string[] = []
) => {
	let result;
	if (pkg.files) {
		result = getFilesIncludedInFilesProperty(pkg, newFiles);
	} else if (npmignoreExistsInPackageRootDir()) {
		result = await getFilesIncludedByDotnpmignore(pkg, newFiles);
	} else {
		result = newFiles;
	}

	return result
		.filter(
			minimatch.filter(`!{${filesIgnoredByDefault.join(',')}}`, {
				matchBase: true,
				dot: true,
			})
		)
		.filter(
			minimatch.filter(getDefaultIncludedFilesGlob(pkg.main!), {
				nocase: true,
				matchBase: true,
			})
		);
};

export const getRegistryUrl = async (
	pkgManager: string,
	pkg: NormalizedPackageJson
) => {
	const args = ['config', 'get', 'registry'];
	if (isExternalRegistry(pkg)) {
		args.push('--registry', pkg.publishConfig.registry);
	}

	const { stdout } = await execa(pkgManager, args);
	return stdout;
};
