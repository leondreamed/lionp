import { copyPackageFiles, rmDist } from 'lion-system';
import { execaCommandSync as exec } from 'execa';

rmDist();
exec('tsc');
await copyPackageFiles();
