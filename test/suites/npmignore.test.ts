import path from 'path';
import { test, expect } from 'vitest';

const newFiles = [
	'source/ignore.txt',
	'source/pay_attention.txt',
	'.hg',
	'test/file.txt',
	'readme.md',
	'README.txt',
];

test('ignored files using file-attribute in package.json with one file', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ files: ['pay_attention.txt'] },
			newFiles
		)
	).toEqual(['source/ignore.txt']);
});

test('ignored file using file-attribute in package.json with directory', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ files: ['source'] },
			newFiles
		)
	).toEqual([]);
});

test('ignored test files using files attribute and directory structure in package.json', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ files: ['source'], directories: { test: 'test-tap' } },
			newFiles
		)
	).toEqual(['test/file.txt']);
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ files: ['source'], directories: { test: ['test-tap'] } },
			newFiles
		)
	).toEqual(['test/file.txt']);
});

test('ignored files using .npmignore', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ name: 'npmignore' },
			newFiles
		)
	).toEqual(['source/ignore.txt']);
});

test('ignored test files using files attribute and .npmignore', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ directories: { test: 'test-tap' } },
			newFiles
		)
	).toEqual(['source/ignore.txt', 'test/file.txt']);
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ directories: { test: ['test-tap'] } },
			newFiles
		)
	).toEqual(['source/ignore.txt', 'test/file.txt']);
});

test('ignored files - dot files using files attribute', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles({ files: ['source'] }, [
			'test/.dotfile',
		])
	).toEqual([]);
});

test('ignored files - dot files using .npmignore', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles({}, ['test/.dot'])
	).toEqual([]);
});

test('ignored files - ignore strategy is not used', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures'),
		},
	});
	expect(
		await testedModule.getNewAndUnpublishedFiles(
			{ name: 'no ignore strategy' },
			newFiles
		)
	).toEqual([]);
});

test('first time published files using file-attribute in package.json with one file', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles(
			{ files: ['pay_attention.txt'] },
			newFiles
		)
	).toEqual(['source/pay_attention.txt']);
});

test('first time published files using file-attribute in package.json with directory', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles(
			{ files: ['source'] },
			newFiles
		)
	).toEqual(['source/ignore.txt', 'source/pay_attention.txt']);
});

test('first time published files using .npmignore', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles(
			{ name: 'npmignore' },
			newFiles
		)
	).toEqual(['source/pay_attention.txt']);
});

test('first time published dot files using files attribute', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles({ files: ['source'] }, [
			'source/.dotfile',
		])
	).toEqual(['source/.dotfile']);
});

test('first time published dot files using .npmignore', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles({}, ['source/.dotfile'])
	).toEqual(['source/.dotfile']);
});

test('first time published files - ignore strategy is not used', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles(
			{ name: 'no ignore strategy' },
			newFiles
		)
	).toEqual(['source/ignore.txt', 'source/pay_attention.txt', 'test/file.txt']);
});

test('first time published files - empty files property', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'package'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles({ files: [] }, newFiles)
	).toEqual([]);
});

test('first time published files - .npmignore excludes everything', async () => {
	const testedModule = proxyquire('../source/npm/util', {
		'pkg-dir': {
			sync: () => path.resolve('test', 'fixtures', 'npmignore'),
		},
	});
	expect(
		await testedModule.getFirstTimePublishedFiles(
			{ name: 'excluded everything' },
			['source/ignore.txt']
		)
	).toEqual([]);
});
