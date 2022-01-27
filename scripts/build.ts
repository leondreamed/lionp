import { copyPackageFiles, rmDist, chProjectDir } from 'lion-system';
import { execaCommandSync as exec } from 'execa';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
copyPackageFiles();
