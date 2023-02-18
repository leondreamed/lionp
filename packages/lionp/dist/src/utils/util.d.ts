import { NormalizedPackageJson } from 'read-pkg-up';
export declare const readPkg: (packagePath?: string) => NormalizedPackageJson;
export declare const linkifyIssues: (url: string | undefined, message: string) => string;
export declare const linkifyCommit: (url: string | undefined, commit: string) => string;
export declare const linkifyCommitRange: (url: string | undefined, commitRange: string) => string;
export declare const getTagVersionPrefix: () => Promise<string>;
export declare const getNewFiles: (pkg: NormalizedPackageJson) => Promise<{
    unpublished: string[];
    firstTime: string[];
}>;
export declare const getPreReleasePrefix: () => Promise<string>;
