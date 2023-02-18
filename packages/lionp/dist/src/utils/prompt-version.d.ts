import type { NormalizedPackageJson } from 'read-pkg-up';
import type { LionpOptions } from '../types/options.js';
declare type PromptVersionOptions = {
    releaseDraftOnly: boolean;
    branch: string;
    repoUrl: string | undefined;
    tag: string | undefined;
    runPublish: boolean;
    version: string | undefined;
    availability: {
        isUnknown: boolean;
        isAvailable: boolean;
    };
};
export declare function promptVersion(options: PromptVersionOptions, pkg: NormalizedPackageJson): Promise<{
    releaseNotes?: LionpOptions['releaseNotes'];
} & ({
    confirm: false;
    version: undefined;
} | {
    confirm: true;
    version: string;
})>;
export {};
