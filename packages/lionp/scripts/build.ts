import { execaCommandSync as exec } from 'execa';
import { chProjectDir, copyPackageFiles, rmDist } from 'lion-system';
import * as fs from 'node:fs';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
await copyPackageFiles({
	additionalFiles: ['npm-binary.config.cjs'],
});

const pkgJson = JSON.parse(
	fs.readFileSync('dist/package.json', 'utf8')
) as Record<string, any>;
pkgJson.scripts.postinstall = 'npm-binary';
fs.writeFileSync('dist/package.json', JSON.stringify(pkgJson, null, '\t'));
