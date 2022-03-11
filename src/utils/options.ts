import type { AnyFlags, Result } from 'meow';
import { readPkg } from './util.js';
import * as git from './git.js';
import { isPackageNameAvailable } from './npm/npm.js';
import type { PossiblyUnversionedLionpOptions } from '~/types/options.js';
import type { DefaultConfig, LionpConfig } from '~/types/config.js';
import type { LionpCliFlags } from '~/types/cli.js';

export async function getLionpOptions(
	config: LionpConfig & DefaultConfig & LionpCliFlags,
	cli: Result<AnyFlags>
): Promise<PossiblyUnversionedLionpOptions> {
	const pkg = readPkg();

	const TBI: any = undefined;

	const options: PossiblyUnversionedLionpOptions = {
		runBuild: config.build,
		/* eslint-disable @typescript-eslint/no-unsafe-assignment */
		runPublish: TBI,
		branch: TBI,
		version: TBI,
		tests: TBI,
		availability: TBI,
		/* eslint-enable @typescript-eslint/no-unsafe-assignment */
		...(config as Omit<typeof config, 'tests' | 'branch'>),
		releaseNotes: () => '',
	};

	options.runPublish =
		!config.releaseDraftOnly && config.publish && !pkg.private;
	options.branch = config.branch ?? (await git.defaultBranch());

	// Use current (latest) version when 'releaseDraftOnly', otherwise use the first argument.
	options.version = config.releaseDraftOnly
		? pkg.version
		: cli.input.length > 0
		? cli.input[0]!
		: config.version;

	if (options.tests === undefined) {
		options.tests = pkg.scripts?.[config.testScript] !== undefined;
	}

	options.availability = config.publish
		? await isPackageNameAvailable(pkg)
		: {
				isAvailable: false,
				isUnknown: false,
		  };

	// Workaround for unintended auto-casing behavior from `meow`.
	if ('2Fa' in options) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
		// @ts-ignore

		options['2fa'] = options['2Fa'];
	}

	return options;
}
