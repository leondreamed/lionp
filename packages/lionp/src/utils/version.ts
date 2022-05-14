import onetime from 'onetime';
import { readPackageUpSync } from 'read-pkg-up';
import type { ReleaseType } from 'semver';
import semver from 'semver';

export const getSemverIncrements = onetime(() => {
	const semverIncrements: ReleaseType[] = [
		'patch',
		'minor',
		'major',
		'prepatch',
		'preminor',
		'premajor',
		'prerelease',
	];

	return semverIncrements;
});

export const getPrereleaseVersions = onetime(() => [
	'prepatch',
	'preminor',
	'premajor',
	'prerelease',
]);

export const createVersion = (version: string) => new Version(version);

export const isPrereleaseOrIncrement = (input: string) =>
	createVersion(input).isPrerelease() ||
	getPrereleaseVersions().includes(input);

const isValidVersion = (input: string) => Boolean(semver.valid(input));

export const isValidInput = (input: string) =>
	getSemverIncrements().includes(input as ReleaseType) || isValidVersion(input);

export const validate = (version: string) => {
	if (!isValidVersion(version)) {
		throw new Error('Version should be a valid semver version.');
	}
};

export const verifyRequirementSatisfied = (
	dependency: string,
	version: string
) => {
	const { packageJson } = readPackageUpSync({
		cwd: new URL('.', import.meta.url).pathname,
	})!;
	const depRange = packageJson.engines![dependency]!;
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
		const semverIncrements = getSemverIncrements();
		if (!isValidInput(input)) {
			throw new Error(
				`Version should be either ${semverIncrements.join(
					', '
				)} or a valid semver version.`
			);
		}

		return semverIncrements.includes(input as ReleaseType)
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
