import * as fs from 'node:fs';

import { copyPackageFiles, rmDist, tsc } from 'lionconfig';

rmDist();
await tsc();
await copyPackageFiles({
	additionalFiles: ['npm-binary.config.cjs'],
});

const pkgJson = JSON.parse(
	fs.readFileSync('dist/package.json', 'utf8')
) as Record<string, any>;
pkgJson.scripts.postinstall = 'npm-binary';
fs.writeFileSync('dist/package.json', JSON.stringify(pkgJson, null, '\t'));
