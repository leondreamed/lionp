import { test, expect } from 'vitest';
import * as sinon from 'sinon';
import lionp from '~/index.js';
import { getDefaultConfig } from '~/utils/config.js';
import { getLionpOptions } from '~/utils/options.js';

const defaultOptions = await getLionpOptions(getDefaultConfig({}), {} as any);

async function lionpVersion(version: string) {
	return lionp({ ...defaultOptions, version });
}

test('version is invalid', async () => {
	const message =
		'Version should be either patch, minor, major, prepatch, preminor, premajor, prerelease, or a valid semver version.';
	await expect(async () => lionpVersion('foo')).rejects.toEqual(message);
	await expect(async () =>
		lionp({ ...defaultOptions, version: '4.x.3' })
	).rejects.toEqual(message);
});

test('version is pre-release', async () => {
	const message =
		'You must specify a dist-tag using --tag when publishing a pre-release version. This prevents accidentally tagging unstable versions as "latest". https://docs.npmjs.com/cli/dist-tag';
	await expect(async () => lionpVersion('premajor')).rejects.toEqual(message);
	await expect(async () => lionpVersion('preminor')).rejects.toEqual(message);
	await expect(async () => lionpVersion('prepatch')).rejects.toEqual(message);
	await expect(async () => lionpVersion('prerelease')).rejects.toEqual(message);
	await expect(async () => lionpVersion('10.0.0-0')).rejects.toEqual(message);
	await expect(async () => lionpVersion('10.0.0-beta')).rejects.toEqual(
		message
	);
});

test('errors on too low version', async () => {
	await expect(async () => lionpVersion('1.0.0')).rejects.toMatch(
		/New version `1\.0\.0` should be higher than current version `\d+\.\d+\.\d+`/
	);
	await expect(async () => lionpVersion('1.0.0-beta')).rejects.toMatch(
		/New version `1\.0\.0-beta` should be higher than current version `\d+\.\d+\.\d+`/
	);
});

test('skip enabling 2FA if the package exists', async () => {
	const enable2faStub = sinon.stub();

	const np = proxyquire('../source', {
		del: sinon.stub(),
		execa: sinon.stub().returns({ pipe: sinon.stub() }),
		'./prerequisite-tasks': sinon.stub(),
		'./git-tasks': sinon.stub(),
		'./git-util': {
			hasUpstream: sinon.stub().returns(true),
			pushGraceful: sinon.stub(),
		},
		'./npm/enable-2fa': enable2faStub,
		'./npm/publish': sinon.stub().returns({ pipe: sinon.stub() }),
	});

	await t.notThrowsAsync(
		np('1.0.0', {
			...defaultOptions,
			availability: {
				isAvailable: false,
				isUnknown: false,
			},
		})
	);

	t.true(enable2faStub.notCalled);
});

test('skip enabling 2FA if the `2fa` option is false', async () => {
	const enable2faStub = sinon.stub();

	const np = proxyquire('../source', {
		del: sinon.stub(),
		execa: sinon.stub().returns({ pipe: sinon.stub() }),
		'./prerequisite-tasks': sinon.stub(),
		'./git-tasks': sinon.stub(),
		'./git-util': {
			hasUpstream: sinon.stub().returns(true),
			pushGraceful: sinon.stub(),
		},
		'./npm/enable-2fa': enable2faStub,
		'./npm/publish': sinon.stub().returns({ pipe: sinon.stub() }),
	});

	await t.notThrowsAsync(
		np('1.0.0', {
			...defaultOptions,
			availability: {
				isAvailable: true,
				isUnknown: false,
			},
			'2fa': false,
		})
	);

	t.true(enable2faStub.notCalled);
});
