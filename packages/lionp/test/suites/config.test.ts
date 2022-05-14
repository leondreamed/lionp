import * as path from 'node:path';
import { test } from 'vitest';

const fixtureBasePath = path.resolve('test', 'fixtures', 'config');

const getConfigsWhenGlobalBinaryIsUsed = async (homedirStub) => {
	const pathsPkgDir = [
		path.resolve(fixtureBasePath, 'pkg-dir'),
		path.resolve(fixtureBasePath, 'local1'),
		path.resolve(fixtureBasePath, 'local2'),
		path.resolve(fixtureBasePath, 'local3'),
	];

	const promises = [];
	for (const pathPkgDir of pathsPkgDir) {
		promises.push(
			proxyquire('../source/config', {
				'is-installed-globally': true,
				async 'pkg-dir'() {
					return pathPkgDir;
				},
				os: {
					homedir: homedirStub,
				},
			})()
		);
	}

	return Promise.all(promises);
};

const getConfigsWhenLocalBinaryIsUsed = async (pathPkgDir) => {
	const homedirs = [
		path.resolve(fixtureBasePath, 'homedir1'),
		path.resolve(fixtureBasePath, 'homedir2'),
		path.resolve(fixtureBasePath, 'homedir3'),
	];

	const promises = [];
	for (const homedir of homedirs) {
		promises.push(
			proxyquire('../source/config', {
				'is-installed-globally': false,
				async 'pkg-dir'() {
					return pathPkgDir;
				},
				os: {
					homedir() {
						return homedir;
					},
				},
			})()
		);
	}

	return Promise.all(promises);
};

test('returns config from home directory when global binary is used and `.np-config-json` exists in home directory', async () => {
	const homedirStub = sinon.stub();
	homedirStub.returns(path.resolve(fixtureBasePath, 'homedir1'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs)
		t.deepEqual(config, { source: 'homedir/.np-config.json' });
});

test('returns config from home directory when global binary is used and `.np-config.js` exists in home directory', async () => {
	const homedirStub = sinon.stub();
	homedirStub.returns(path.resolve(fixtureBasePath, 'homedir2'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs)
		t.deepEqual(config, { source: 'homedir/.np-config.js' });
});

test('returns config from home directory when global binary is used and `.np-config.cjs` exists in home directory', async () => {
	const homedirStub = sinon.stub();
	homedirStub.returns(path.resolve(fixtureBasePath, 'homedir3'));
	const configs = await getConfigsWhenGlobalBinaryIsUsed(homedirStub);
	for (const config of configs)
		t.deepEqual(config, { source: 'homedir/.np-config.cjs' });
});

test('returns config from package directory when local binary is used and `package.json` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'pkg-dir')
	);
	for (const config of configs) t.deepEqual(config, { source: 'package.json' });
});

test('returns config from package directory when local binary is used and `.np-config.json` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local1')
	);
	for (const config of configs)
		t.deepEqual(config, { source: 'packagedir/.np-config.json' });
});

test('returns config from package directory when local binary is used and `.np-config.js` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local2')
	);
	for (const config of configs)
		t.deepEqual(config, { source: 'packagedir/.np-config.js' });
});

test('returns config from package directory when local binary is used and `.np-config.cjs` exists in package directory', async () => {
	const configs = await getConfigsWhenLocalBinaryIsUsed(
		path.resolve(fixtureBasePath, 'local3')
	);
	for (const config of configs)
		t.deepEqual(config, { source: 'packagedir/.np-config.cjs' });
});
