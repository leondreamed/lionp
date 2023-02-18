import { Listr } from 'listr2';
import type { NormalizedPackageJson } from 'read-pkg-up';
import type { LionpOptions } from '../types/options.js';
export declare const prerequisiteTasks: (input: string, pkg: NormalizedPackageJson, options: LionpOptions) => Listr<any, "default", "verbose">;
