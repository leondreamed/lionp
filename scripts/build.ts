import * as path from 'node:path';
import * as fs from 'node:fs';
import { execaCommandSync as exec } from 'execa';

const rootPath = new URL('..', import.meta.url).pathname;

fs.rmSync(path.join(rootPath, 'dist'), { recursive: true, force: true });
exec('tsc');
fs.copyFileSync('package.json', 'dist/package.json');
