import * as path from 'node:path';
import * as fs from 'node:fs';
import { execaCommandSync as exec } from 'execa';

const rootPath = new URL('..', import.meta.url).pathname;

fs.rmSync(path.join(rootPath, 'dist'), { recursive: true, force: true });
exec('tsc');
for (const file of ['package.json', 'README.md'])
	fs.copyFileSync(file, path.join('dist', file));
