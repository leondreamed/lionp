import { Listr } from 'listr2';
import type { LionpOptions } from '../types/options.js';
export declare const gitTasks: (options: LionpOptions) => Listr<any, "default", "verbose">;
