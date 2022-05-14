import { execaSync } from 'execa';
import lionFixture from 'lion-fixture';
import { expect, test } from 'vitest';

const { fixture } = lionFixture(import.meta.url);

test('generates changelog', async () => {
	const changelogTempDir = await fixture('changelog');
	expect(() =>
		execaSync('node', ['test.js'], {
			cwd: changelogTempDir,
			stdio: 'inherit',
		})
	).to.not.throw();
});
