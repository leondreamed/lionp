import onetime from 'onetime';
import { readPackageUpSync } from 'read-pkg-up';
import semver from 'semver';
export const getSemverIncrements = onetime(() => {
    const semverIncrements = [
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
export const createVersion = (version) => new Version(version);
export const isPrereleaseOrIncrement = (input) => createVersion(input).isPrerelease() ||
    getPrereleaseVersions().includes(input);
const isValidVersion = (input) => Boolean(semver.valid(input));
export const isValidInput = (input) => getSemverIncrements().includes(input) || isValidVersion(input);
export const validate = (version) => {
    if (!isValidVersion(version)) {
        throw new Error('Version should be a valid semver version.');
    }
};
export const verifyRequirementSatisfied = (dependency, version) => {
    const { packageJson } = readPackageUpSync({
        cwd: new URL('.', import.meta.url).pathname,
    });
    const depRange = packageJson.engines[dependency];
    if (!createVersion(version).satisfies(depRange)) {
        throw new Error(`Please upgrade to ${dependency}${depRange}`);
    }
};
export class Version {
    constructor(version) {
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.version = version;
    }
    isPrerelease() {
        return Boolean(semver.prerelease(this.version));
    }
    satisfies(range) {
        validate(this.version);
        return semver.satisfies(this.version, range, {
            includePrerelease: true,
        });
    }
    getNewVersionFrom(input) {
        validate(this.version);
        const semverIncrements = getSemverIncrements();
        if (!isValidInput(input)) {
            throw new Error(`Version should be either ${semverIncrements.join(', ')} or a valid semver version.`);
        }
        return semverIncrements.includes(input)
            ? semver.inc(this.version, input)
            : input;
    }
    isGreaterThanOrEqualTo(otherVersion) {
        validate(this.version);
        validate(otherVersion);
        return semver.gte(otherVersion, this.version);
    }
    isLowerThanOrEqualTo(otherVersion) {
        validate(this.version);
        validate(otherVersion);
        return semver.lte(otherVersion, this.version);
    }
}
