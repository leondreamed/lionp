import process from 'node:process';
import logSymbols from 'log-symbols';
import meow from 'meow';
import type { Package } from 'update-notifier';
import updateNotifier from 'update-notifier';
import type { ExecaError } from 'execa';
import { getConfig, getDefaultConfig } from './config.js';
import { getSemverIncrements } from './version.js';
import { readPkg } from './util.js';
import { lionp } from './lionp.js';
import { promptVersion } from './prompt-version.js';
import { getLionpOptions } from './options.js';
import type { DefaultConfig, LionpConfig } from '~/types/config.js';
import type { LionpCliFlags } from '~/types/cli.js';

export function getLionpCli() {
	return meow(
		`
	Usage
	  $ lionp <version>
	  Version can be:
	    ${getSemverIncrements().join(' | ')} | 1.2.3
	Options
	  --any-branch           Allow publishing from any branch
	  --branch               Name of the release branch (default: main | master)
	  --no-cleanup           Skips cleanup of node_modules
	  --no-tests             Skips tests
	  --no-publish           Skips publishing
	  --preview              Show tasks without actually executing them
	  --tag                  Publish under a given dist-tag
	  --no-release-draft     Skips opening a GitHub release draft
	  --release-draft-only   Only opens a GitHub release draft for the latest published version
	  --test-script          Name of npm run script to run tests before publishing (default: test)
	  --no-2fa               Don't enable 2FA on new packages (not recommended)
	  --message              Version bump commit message, '%s' will be replaced with version (default: '%s' with npm and 'v%s' with yarn)
	Examples
	  $ lionp
	  $ lionp patch
	  $ lionp 1.0.2
	  $ lionp 1.0.2-beta.3 --tag=beta
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
}

export async function lionpCli() {
	const cli = getLionpCli();
	updateNotifier({ pkg: cli.pkg as Package }).notify();

	try {
		const pkg = readPkg();

		const defaultConfig = getDefaultConfig(pkg);
		const localConfig = await getConfig();

		const config = {
			...defaultConfig,
			...localConfig,
			...cli.flags,
		} as DefaultConfig & LionpConfig & LionpCliFlags;

		const options = await getLionpOptions(config, cli);

		const promptResults = await promptVersion(options, pkg);

		if (!promptResults.confirm) {
			process.exit(0);
		}

		console.log(); // Prints a newline for readability
		const newPkg = await lionp({ ...options, ...promptResults });

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
