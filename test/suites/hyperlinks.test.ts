import { test, afterEach, expect } from 'vitest';
import { createSandbox } from 'sinon';
import terminalLink from 'terminal-link';
import {
	linkifyIssues,
	linkifyCommit,
	linkifyCommitRange,
} from '~/utils/util.js';

const MOCK_REPO_URL = 'https://github.com/unicorn/rainbow';
const MOCK_COMMIT_HASH = '5063f8a';
const MOCK_COMMIT_RANGE = `${MOCK_COMMIT_HASH}...master`;

const sandbox = createSandbox();

afterEach(() => {
	sandbox.restore();
});

const mockTerminalLinkUnsupported = () =>
	sandbox.stub(terminalLink, 'isSupported').value(false);

test('linkifyIssues correctly links issues', () => {
	expect(linkifyIssues(MOCK_REPO_URL, 'Commit message - fixes #4')).toEqual(
		'Commit message - fixes ]8;;https://github.com/unicorn/rainbow/issues/4#4]8;;'
	);
	expect(linkifyIssues(MOCK_REPO_URL, 'Commit message - fixes #3 #4')).toEqual(
		'Commit message - fixes ]8;;https://github.com/unicorn/rainbow/issues/3#3]8;; ]8;;https://github.com/unicorn/rainbow/issues/4#4]8;;'
	);
	expect(
		linkifyIssues(MOCK_REPO_URL, 'Commit message - fixes foo/bar#4')
	).toEqual('Commit message - fixes ]8;;https://github.com/foo/bar/issues/4foo/bar#4]8;;');
});

test('linkifyIssues returns raw message if url is not provided', () => {
	const message = 'Commit message - fixes #5';
	expect(linkifyIssues(undefined, message)).toEqual(message);
});

test('linkifyIssues returns raw message if terminalLink is not supported', () => {
	mockTerminalLinkUnsupported();
	const message = 'Commit message - fixes #6';
	expect(linkifyIssues(MOCK_REPO_URL, message)).toEqual(message);
});

test('linkifyCommit correctly links commits', () => {
	expect(linkifyCommit(MOCK_REPO_URL, MOCK_COMMIT_HASH)).toEqual(']8;;https://github.com/unicorn/rainbow/commit/5063f8a5063f8a]8;;');
});

test('linkifyCommit returns raw commit hash if url is not provided', () => {
	expect(linkifyCommit(undefined, MOCK_COMMIT_HASH)).toEqual(MOCK_COMMIT_HASH);
});

test('linkifyCommit returns raw commit hash if terminalLink is not supported', () => {
	mockTerminalLinkUnsupported();
	expect(linkifyCommit(MOCK_REPO_URL, MOCK_COMMIT_HASH)).toEqual(
		MOCK_COMMIT_HASH
	);
});

test('linkifyCommitRange returns raw commitRange if url is not provided', () => {
	expect(linkifyCommitRange(undefined, MOCK_COMMIT_RANGE)).toEqual(
		MOCK_COMMIT_RANGE
	);
});

test('linkifyCommitRange returns raw commitRange if terminalLink is not supported', () => {
	mockTerminalLinkUnsupported();
	expect(linkifyCommitRange(MOCK_REPO_URL, MOCK_COMMIT_RANGE)).toEqual(
		MOCK_COMMIT_RANGE
	);
});
