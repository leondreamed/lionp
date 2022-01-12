import process from 'node:process';
import 'symbol-observable'; // Important: This needs to be first to prevent weird Observable incompatibilities
import logSymbols from 'log-symbols';
import meow from 'meow';
import type { Package } from 'update-notifier';
import updateNotifier from 'update-notifier';
import type { ExecaError } from 'execa';
import { getConfig } from './config.js';
import * as git from './git.js';
import { SEMVER_INCREMENTS } from './version.js';
import { isPackageNameAvailable } from './npm/index.js';
import { readPkg } from './util.js';
import { lionp } from './lionp.js';
import { promptVersion } from './prompt-version.js';

export async function lionpCli() {
	const cli = meow(
		`
	Usage
	  $ np <version>
	  Version can be:
	    ${SEMVER_INCREMENTS.join(' | ')} | 1.2.3
	Options
	  --any-branch           Allow publishing from any branch
	  --branch               Name of the release branch (default: main | master)
	  --no-cleanup           Skips cleanup of node_modules
	  --no-tests             Skips tests
	  --yolo                 Skips cleanup and testing
	  --no-publish           Skips publishing
	  --preview              Show tasks without actually executing them
	  --tag                  Publish under a given dist-tag
	  --no-yarn              Don't use Yarn
	  --contents             Subdirectory to publish
	  --no-release-draft     Skips opening a GitHub release draft
	  --release-draft-only   Only opens a GitHub release draft for the latest published version
	  --test-script          Name of npm run script to run tests before publishing (default: test)
	  --no-2fa               Don't enable 2FA on new packages (not recommended)
	  --message              Version bump commit message, '%s' will be replaced with version (default: '%s' with npm and 'v%s' with yarn)
	Examples
	  $ np
	  $ np patch
	  $ np 1.0.2
	  $ np 1.0.2-beta.3 --tag=beta
	  $ np 1.0.2-beta.3 --tag=beta --contents=dist
`,
		{
			importMeta: import.meta,
			booleanDefault: undefined,
			flags: {
				anyBranch: {
					type: 'boolean',
				},
				branch: {
					type: 'string',
				},
				cleanup: {
					type: 'boolean',
				},
				tests: {
					type: 'boolean',
				},
				yolo: {
					type: 'boolean',
				},
				publish: {
					type: 'boolean',
				},
				releaseDraft: {
					type: 'boolean',
				},
				releaseDraftOnly: {
					type: 'boolean',
				},
				tag: {
					type: 'string',
				},
				yarn: {
					type: 'boolean',
				},
				contents: {
					type: 'string',
				},
				preview: {
					type: 'boolean',
				},
				testScript: {
					type: 'string',
				},
				'2fa': {
					type: 'boolean',
				},
				message: {
					type: 'string',
				},
			},
		}
	);

	updateNotifier({ pkg: cli.pkg as Package }).notify();

	try {
		const pkg = readPkg();

		const defaultFlags = {
			cleanup: true,
			tests: true,
			publish: true,
			releaseDraft: true,
			'2fa': true,
		};

		const localConfig = await getConfig();

		const flags = {
			...defaultFlags,
			...localConfig,
			...cli.flags,
		};

		// Workaround for unintended auto-casing behavior from `meow`.
		if ('2Fa' in flags) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,
			flags['2fa'] = flags['2Fa'];
		}

		const runPublish = !flags.releaseDraftOnly && flags.publish && !pkg.private;

		const availability = flags.publish
			? await isPackageNameAvailable(pkg)
			: {
					isAvailable: false,
					isUnknown: false,
			  };

		// Use current (latest) version when 'releaseDraftOnly', otherwise use the first argument.
		const version = flags.releaseDraftOnly
			? pkg.version
			: cli.input.length > 0
			? cli.input[0]
			: undefined;

		const branch = flags.branch ?? (await git.defaultBranch());
		const options = await promptVersion(
			{
				...flags,
				availability,
				version,
				runPublish,
				branch,
			},
			pkg
		);

		if (!options.confirm) {
			process.exit(0);
		}

		console.log(); // Prints a newline for readability
		const newPkg = await lionp(options.version, options);

		if (options.preview || options.releaseDraftOnly) {
			return;
		}

		console.log(`\n ${newPkg.name} ${newPkg.version} published 🎉`);
	} catch (error: unknown) {
		const err = error as ExecaError;
		console.error(`\n${logSymbols.error} ${err.message}`);
		process.exit(1);
	}
}
