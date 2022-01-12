import type { ReleaseType } from 'semver';

export type LionpOptions = {
	releaseNotes: (tag: string) => string;
	'2fa': boolean;
	testScript?: string;
	version: ReleaseType;
	preview?: boolean;
	anyBranch?: string;
	branch: string;
	runPublish: boolean;
	message: string;
	tag?: string;
	otp: string;
	publishScoped: boolean;
	tests?: boolean;
	cleanup?: boolean;
	contents?: string;
	repoUrl?: string;
	releaseDraft: boolean;
	availability: {
		isAvailable: boolean;
		isUnknown: boolean;
	};
};
