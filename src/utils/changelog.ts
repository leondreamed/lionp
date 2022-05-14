import { execa } from 'execa';
import { getBinaryPath } from 'npm-binary';

export async function genChangelog() {
	const gitCliffPath = getBinaryPath('git-cliff', import.meta.url);
	const { stdout } = await execa(gitCliffPath);
	return stdout;
}
