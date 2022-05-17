/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import * as path from 'node:path';
import { expect, test, vi } from 'vitest';

const fixtureBasePath = path.resolve('test', 'fixtures', 'config');

const getConfigsWhenGlobalBinaryIsUsed = async (homedirStub: () => string) => {
	const pathsPkgDir = [
		path.resolve(fixtureBasePath, 'pkg-dir'),
		path.resolve(fixtureBasePath, 'local1'),
		path.resolve(fixtureBasePath, 'local2'),
		path.resolve(fixtureBasePath, 'local3'),
	];

	return Promise.all(
		pathsPkgDir.map(async (pathPkgDir) => {
			vi.mock('os', async () => {
				const os = (await vi.importActual('os')) as any;
				return { ...os, homedir: homedirStub };
			});

			vi.mock('pkg-dir', async () => {
				const pkgDir = (await vi.importActual('pkg-dir')) as any;
				return {
					...pkgDir,
					packageDirectory() {
						return pathPkgDir;
					},
				};
			});

			const { getConfig } = await import('~/utils/config.js');
			return getConfig();
		})
	);
};

const getConfigsWhenLocalBinaryIsUsed = async (pathPkgDir: string) => {
	const homedirs = [
		path.resolve(fixtureBasePath, 'homedir1'),
		path.resolve(fixtureBasePath, 'homedir2'),
		path.resolve(fixtureBasePath, 'homedir3'),
	];

	return Promise.all(
		homedirs.map(async (homedir) => {
			vi.mock('os', async () => {
				const os = (await vi.importActual('os')) as any;
				return {
					...os,
					homedir() {
						return homedir;
					},
				};
			});

			vi.mock('pkg-dir', async () => {
				const pkgDir = (await vi.importActual('pkg-dir')) as any;
				return {
					...pkgDir,
					packageDirectory() {
						return pathPkgDir;
					},
				};
			});

			const { getConfig } = await import('~/utils/config.js');
			return getConfig();
		})
	);
};

test('returns config from home directory when global binary is used and `.np-config-json` exists in home directory', async () => {
	const homedirStub = vi.fn(() => path.resolve(fixtureBasePath, 'homedir1'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs) {
		expect(config).toEqual({ source: 'homedir/.np-config.json' });
	}
});

test('returns config from home directory when global binary is used and `.np-config.js` exists in home directory', async () => {
	const homedirStub = vi.fn(() => path.resolve(fixtureBasePath, 'homedir2'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs) {
		expect(config).toEqual({ source: 'homedir/.np-config.js' });
	}
});

test('returns config from home directory when global binary is used and `.np-config.cjs` exists in home directory', async () => {
	const homedirStub = vi.fn(() => path.resolve(fixtureBasePath, 'homedir3'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs) {
		expect(config).toEqual({ source: 'homedir/.np-config.cjs' });
	}
});

test('returns config from package directory when local binary is used and `package.json` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'pkg-dir')
	);
	for (const config of configs) {
		expect(config).toEqual({ source: 'package.json' });
	}
});

test('returns config from package directory when local binary is used and `.np-config.json` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local1')
	);
	for (const config of configs) {
		expect(config).toEqual({ source: 'packagedir/.np-config.json' });
	}
});

test('returns config from package directory when local binary is used and `.np-config.js` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local2')
	);
	for (const config of configs) {
		expect(config).toEqual({ source: 'packagedir/.np-config.js' });
	}
});

test('returns config from package directory when local binary is used and `.np-config.cjs` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local3')
	);
	for (const config of configs) {
		expect(config).toEqual({ source: 'packagedir/.np-config.cjs' });
	}
});
