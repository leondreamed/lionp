import * as path from 'node:path';
import { execa } from 'execa';
import { findUpSync } from 'find-up';
import { getBinaryPath } from 'npm-binary';
export async function genChangelog() {
    const gitCliffPath = getBinaryPath('git-cliff', import.meta.url);
    const gitDirectory = findUpSync('.git', { type: 'directory' });
    if (gitDirectory === undefined) {
        throw new Error('`.git` directory was not found for the project.');
    }
    const { stdout: commitsContextJson } = await execa(gitCliffPath, ['--context'], {
        cwd: path.dirname(gitDirectory),
    });
    const commitsContext = JSON.parse(commitsContextJson);
    for (const _commit of commitsContext) {
        // TODO
    }
    return commitsContextJson;
}
