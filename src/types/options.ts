export type LionpOptions = {
	'2fa': boolean;
	testScript: string;
	buildScript: string;
	build: boolean;
	version: string;
	preview: boolean;
	anyBranch: boolean;
	branch: string;
	message?: string;
	tag?: string;
	publishScoped: boolean;
	tests: boolean;
	cleanup: boolean;
	repoUrl?: string;
	releaseDraft: boolean;
	releaseDraftOnly: boolean;
	runPublish: boolean;
	runBuild: boolean;
	availability: {
		isAvailable: boolean;
		isUnknown: boolean;
	};
	releaseNotes: (tag: string) => string | undefined;
};
