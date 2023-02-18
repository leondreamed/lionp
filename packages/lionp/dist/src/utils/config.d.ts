import type { NormalizedPackageJson } from 'read-pkg-up';
import type { LionpConfig } from '../types/config.js';
export declare function getConfig(): Promise<Partial<LionpConfig>>;
export declare function getDefaultConfig(pkg: NormalizedPackageJson): {
    build: true;
    cleanup: true;
    publish: true;
    tests: true;
    releaseDraft: true;
    releaseDraftOnly: false;
    preview: false;
    anyBranch: false;
    testScript: string;
    buildScript: string;
    publishScoped: boolean;
    '2fa': false;
    repoUrl: string | undefined;
};
