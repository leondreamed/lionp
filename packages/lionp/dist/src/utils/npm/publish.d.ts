import type { ListrTaskWrapper } from 'listr2';
import type { LionpOptions } from '../../types/options.js';
export declare const getPackagePublishArguments: (options: LionpOptions & {
    otp?: string;
}) => string[];
export declare function publish(context: {
    otp: string;
}, pkgManager: string, task: ListrTaskWrapper<{
    otp: string;
}, any>, options: LionpOptions): Promise<void>;
