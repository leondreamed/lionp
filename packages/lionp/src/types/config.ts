import type { getDefaultConfig } from '~/utils/config.js';

export type LionpConfig = Partial<{
	'2fa': boolean;
	testScript: string;
	buildScript: string;
	build: boolean;
	version: string;
	preview: boolean;
	anyBranch: boolean;
	branch: string;
	message: string;
	tag: string;
	publishScoped: boolean;
	tests: boolean;
	cleanup: boolean;
	repoUrl: string;
	releaseDraft: boolean;
	releaseDraftOnly: boolean;
	publish: boolean;
}>;

export type DefaultConfig = ReturnType<typeof getDefaultConfig>;
