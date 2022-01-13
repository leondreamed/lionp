export type LionpOptions = {
	releaseNotes: (tag: string) => string;
	'2fa'?: boolean;
	testScript?: string;
	buildScript?: string;
	version?: string;
	preview?: boolean;
	anyBranch?: boolean;
	branch?: string;
	runPublish?: boolean;
	runBuild?: boolean;
	message?: string;
	tag?: string;
	publishScoped?: boolean;
	tests?: boolean;
	otp?: string;
	cleanup?: boolean;
	repoUrl?: string;
	releaseDraft?: boolean;
	releaseDraftOnly?: boolean;
	availability?: {
		isAvailable: boolean;
		isUnknown: boolean;
	};
	publish?: boolean;
};
