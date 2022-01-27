import process from 'node:process';
import { execaCommandSync as exec } from 'execa';
import { chProjectDir } from 'lion-system';

chProjectDir(import.meta.url);

try {
	exec('pnpm exec lint-staged', { stdio: 'inherit' });
} catch {
	process.exit(1);
}
