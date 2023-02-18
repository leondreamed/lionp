import type { ReleaseType } from 'semver';
export declare const getSemverIncrements: () => ReleaseType[];
export declare const getPrereleaseVersions: () => string[];
export declare const createVersion: (version: string) => Version;
export declare const isPrereleaseOrIncrement: (input: string) => boolean;
export declare const isValidInput: (input: string) => boolean;
export declare const validate: (version: string) => void;
export declare const verifyRequirementSatisfied: (dependency: string, version: string) => void;
export declare class Version {
    version: string;
    constructor(version: string);
    isPrerelease(): boolean;
    satisfies(range: string): boolean;
    getNewVersionFrom(input: string): string | null;
    isGreaterThanOrEqualTo(otherVersion: string): boolean;
    isLowerThanOrEqualTo(otherVersion: string): boolean;
}
