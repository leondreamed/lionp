import type * as normalize from 'normalize-package-data';
import type { NormalizedPackageJson } from 'read-pkg-up';
import type { PackageJson } from 'type-fest';
export declare const isExternalRegistry: (pkg: NormalizedPackageJson) => pkg is {
    [x: string]: import("type-fest").JsonValue;
} & {
    [x: string]: import("type-fest").JsonValue | undefined;
} & PackageJson.NodeJsStandard & PackageJson.PackageJsonStandard & PackageJson.NonStandardEntryPoints & PackageJson.TypeScriptConfiguration & PackageJson.YarnConfiguration & PackageJson.JSPMConfiguration & normalize.Package & {
    publishConfig: {
        registry: string;
    };
};
export declare const checkConnection: () => Promise<boolean>;
export declare const username: ({ externalRegistry, }: {
    externalRegistry: undefined | string | false;
}) => Promise<string>;
export declare const collaborators: (pkg: NormalizedPackageJson) => Promise<string | false>;
export declare const prereleaseTags: (packageName: string) => Promise<string[]>;
export declare const isPackageNameAvailable: (pkg: NormalizedPackageJson) => Promise<{
    isAvailable: boolean;
    isUnknown: boolean;
}>;
export declare const getNpmVersion: () => Promise<string>;
export declare const verifyRecentNpmVersion: () => Promise<void>;
export declare const checkIgnoreStrategy: ({ files, }: {
    files: string[] | undefined;
}) => void;
export declare const getNewAndUnpublishedFiles: (pkg: NormalizedPackageJson, newFiles?: string[]) => Promise<string[]>;
export declare const getFirstTimePublishedFiles: (pkg: NormalizedPackageJson, newFiles?: string[]) => Promise<string[]>;
export declare const getRegistryUrl: (pkgManager: string, pkg: NormalizedPackageJson) => Promise<string>;
