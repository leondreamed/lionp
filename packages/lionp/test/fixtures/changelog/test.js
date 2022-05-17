import { genChangelog } from 'lionp/utils/changelog.js';
import process from 'node:process';

process.stdout.write(await genChangelog());
