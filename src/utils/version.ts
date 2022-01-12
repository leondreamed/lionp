import type { ReleaseType } from 'semver';
import semver from 'semver';

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
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, unicorn/prefer-module
	const depRange = require('../package.json').engines[dependency] as string;
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

	getNewVersionFrom(input: ReleaseType) {
		validate(this.version);
		if (!isValidInput(input)) {
			throw new Error(
				`Version should be either ${SEMVER_INCREMENTS.join(
					', '
				)} or a valid semver version.`
			);
		}

		return SEMVER_INCREMENTS.includes(input)
			? semver.inc(this.version, input)
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
