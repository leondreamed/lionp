import type { ListrTaskWrapper } from 'listr2';
export declare const getEnable2faArgs: (packageName: string, options: {
    otp?: string;
}) => string[];
export declare function enable2fa(task: ListrTaskWrapper<{
    otp: string;
}, any>, packageName: string, options: {
    otp: string;
}): Promise<void>;
