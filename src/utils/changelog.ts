import { getBinaryPath } from 'npm-binary';
import { execa } from 'execa';

export async function genChangelog() {
	const gitCliffPath = getBinaryPath('git-cliff', import.meta.url);
	const { stdout } = await execa(gitCliffPath);
	return stdout;
}
