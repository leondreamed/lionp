import * as path from 'node:path';
import * as fs from 'node:fs';
import type { ReleaseType } from 'semver';
import semver from 'semver';
import { rootPath } from './paths.js';

export const SEMVER_INCREMENTS: ReleaseType[] = [
	'patch',
	'minor',
	'major',
	'prepatch',
	'preminor',
	'premajor',
	'prerelease',
];
export const PRERELEASE_VERSIONS = [
	'prepatch',
	'preminor',
	'premajor',
	'prerelease',
];

export const createVersion = (version: string) => new Version(version);

export const isPrereleaseOrIncrement = (input: string) =>
	createVersion(input).isPrerelease() || PRERELEASE_VERSIONS.includes(input);

const isValidVersion = (input: string) => Boolean(semver.valid(input));

export const isValidInput = (input: string) =>
	SEMVER_INCREMENTS.includes(input as ReleaseType) || isValidVersion(input);

export const validate = (version: string) => {
	if (!isValidVersion(version)) {
		throw new Error('Version should be a valid semver version.');
	}
};

export const verifyRequirementSatisfied = (
	dependency: string,
	version: string
) => {
	const depRange = JSON.parse(
		fs.readFileSync(path.join(rootPath, 'package.json')).toString()
	).engines[dependency] as string;
	if (!createVersion(version).satisfies(depRange)) {
		throw new Error(`Please upgrade to ${dependency}${depRange}`);
	}
};

export class Version {
	version: string;

	constructor(version: string) {
		this.version = version;
	}

	isPrerelease() {
		return Boolean(semver.prerelease(this.version));
	}

	satisfies(range: string) {
		validate(this.version);
		return semver.satisfies(this.version, range, {
			includePrerelease: true,
		});
	}

	getNewVersionFrom(input: string) {
		validate(this.version);
		if (!isValidInput(input)) {
			throw new Error(
				`Version should be either ${SEMVER_INCREMENTS.join(
					', '
				)} or a valid semver version.`
			);
		}

		return SEMVER_INCREMENTS.includes(input as ReleaseType)
			? semver.inc(this.version, input as ReleaseType)
			: input;
	}

	isGreaterThanOrEqualTo(otherVersion: string) {
		validate(this.version);
		validate(otherVersion);

		return semver.gte(otherVersion, this.version);
	}

	isLowerThanOrEqualTo(otherVersion: string) {
		validate(this.version);
		validate(otherVersion);

		return semver.lte(otherVersion, this.version);
	}
}
