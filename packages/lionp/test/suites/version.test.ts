import { expect, test } from 'vitest';

import * as version from '~/utils/version.js';

test('version.SEMVER_INCREMENTS', () => {
	expect(version.getSemverIncrements()).toEqual([
		'patch',
		'minor',
		'major',
		'prepatch',
		'preminor',
		'premajor',
		'prerelease',
	]);
});

test('version.PRERELEASE_VERSIONS', () => {
	expect(version.getSemverIncrements()).toEqual([
		'prepatch',
		'preminor',
		'premajor',
		'prerelease',
	]);
});

test('version.isValidInput', () => {
	expect(version.isValidInput(null as any)).toBe(false);
	expect(version.isValidInput('foo')).toBe(false);
	expect(version.isValidInput('1.0.0.0')).toBe(false);

	expect(version.isValidInput('patch')).toBe(true);
	expect(version.isValidInput('minor')).toBe(true);
	expect(version.isValidInput('major')).toBe(true);
	expect(version.isValidInput('prepatch')).toBe(true);
	expect(version.isValidInput('preminor')).toBe(true);
	expect(version.isValidInput('premajor')).toBe(true);
	expect(version.isValidInput('prerelease')).toBe(true);
	expect(version.isValidInput('1.0.0')).toBe(true);
	expect(version.isValidInput('1.1.0')).toBe(true);
	expect(version.isValidInput('1.0.1')).toBe(true);
	expect(version.isValidInput('1.0.0-beta')).toBe(true);
	expect(version.isValidInput('2.0.0-rc.2')).toBe(true);
});

test('version.isPrerelease', () => {
	expect(version.createVersion('1.0.0').isPrerelease()).toBe(false);
	expect(version.createVersion('1.1.0').isPrerelease()).toBe(false);
	expect(version.createVersion('1.0.1').isPrerelease()).toBe(false);

	expect(version.createVersion('1.0.0-beta').isPrerelease()).toBe(true);
	expect(version.createVersion('2.0.0-rc.2').isPrerelease()).toBe(true);
});

test('version.isPrereleaseOrIncrement', () => {
	expect(version.isPrereleaseOrIncrement('patch')).toBe(false);
	expect(version.isPrereleaseOrIncrement('minor')).toBe(false);
	expect(version.isPrereleaseOrIncrement('major')).toBe(false);

	expect(version.isPrereleaseOrIncrement('prepatch')).toBe(true);
	expect(version.isPrereleaseOrIncrement('preminor')).toBe(true);
	expect(version.isPrereleaseOrIncrement('premajor')).toBe(true);
	expect(version.isPrereleaseOrIncrement('prerelease')).toBe(true);
});

test('version.getNewVersionFrom', () => {
	const message =
		'Version should be either patch, minor, major, prepatch, preminor, premajor, prerelease or a valid semver version.';

	expect(() =>
		version.createVersion('1.0.0').getNewVersionFrom('patchxxx')
	).toThrow(message);
	expect(() =>
		version.createVersion('1.0.0').getNewVersionFrom('1.0.0.0')
	).toThrow(message);

	expect(version.createVersion('1.0.0').getNewVersionFrom('patch')).toEqual(
		'1.0.1'
	);
	expect(version.createVersion('1.0.0').getNewVersionFrom('minor')).toEqual(
		'1.1.0'
	);
	expect(version.createVersion('1.0.0').getNewVersionFrom('major')).toEqual(
		'2.0.0'
	);

	expect(
		version.createVersion('1.0.0-beta').getNewVersionFrom('major')
	).toEqual('1.0.0');
	expect(version.createVersion('1.0.0').getNewVersionFrom('prepatch')).toEqual(
		'1.0.1-0'
	);
	expect(
		version.createVersion('1.0.1-0').getNewVersionFrom('prepatch')
	).toEqual('1.0.2-0');

	expect(
		version.createVersion('1.0.0-0').getNewVersionFrom('prerelease')
	).toEqual('1.0.0-1');
	expect(
		version.createVersion('1.0.1-0').getNewVersionFrom('prerelease')
	).toEqual('1.0.1-1');
});

test('version.validate', () => {
	const message = 'Version should be a valid semver version.';

	expect(() => {
		version.validate('patch');
	}).toThrow(message);
	expect(() => {
		version.validate('patchxxx');
	}).toThrow(message);
	expect(() => {
		version.validate('1.0.0.0');
	}).toThrow(message);

	expect(() => {
		version.validate('1.0.0');
	}).not.toThrow();
	expect(() => {
		version.validate('1.0.0-beta');
	}).not.toThrow();
	expect(() => {
		version.validate('1.0.0-0');
	}).not.toThrow();
});

test('version.isGreaterThanOrEqualTo', () => {
	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('0.0.1')).toBe(
		false
	);
	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('0.1.0')).toBe(
		false
	);

	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('1.0.0-0')).toBe(
		false
	);
	expect(
		version.createVersion('1.0.0').isGreaterThanOrEqualTo('1.0.0-beta')
	).toBe(false);

	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('1.0.0')).toBe(
		true
	);
	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('1.0.1')).toBe(
		true
	);
	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('1.1.0')).toBe(
		true
	);
	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('2.0.0')).toBe(
		true
	);

	expect(version.createVersion('1.0.0').isGreaterThanOrEqualTo('2.0.0-0')).toBe(
		true
	);
	expect(
		version.createVersion('1.0.0').isGreaterThanOrEqualTo('2.0.0-beta')
	).toBe(true);
});

test('version.isLowerThanOrEqualTo', () => {
	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('0.0.1')).toBe(
		true
	);
	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('0.1.0')).toBe(
		true
	);

	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('1.0.0-0')).toBe(
		true
	);
	expect(
		version.createVersion('1.0.0').isLowerThanOrEqualTo('1.0.0-beta')
	).toBe(true);
	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('1.0.0')).toBe(
		true
	);

	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('1.0.1')).toBe(
		false
	);
	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('1.1.0')).toBe(
		false
	);
	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('2.0.0')).toBe(
		false
	);

	expect(version.createVersion('1.0.0').isLowerThanOrEqualTo('2.0.0-0')).toBe(
		false
	);
	expect(
		version.createVersion('1.0.0').isLowerThanOrEqualTo('2.0.0-beta')
	).toBe(false);
});

test('version.satisfies', () => {
	expect(
		version.createVersion('2.15.8').satisfies('>=2.15.8 <3.0.0 || >=3.10.1')
	).toBe(true);
	expect(
		version.createVersion('2.99.8').satisfies('>=2.15.8 <3.0.0 || >=3.10.1')
	).toBe(true);
	expect(
		version.createVersion('3.10.1').satisfies('>=2.15.8 <3.0.0 || >=3.10.1')
	).toBe(true);
	expect(version.createVersion('6.7.0-next.0').satisfies('<6.8.0')).toBe(true);
	expect(
		version.createVersion('3.0.0').satisfies('>=2.15.8 <3.0.0 || >=3.10.1')
	).toBe(false);
	expect(
		version.createVersion('3.10.0').satisfies('>=2.15.8 <3.0.0 || >=3.10.1')
	).toBe(false);
});
