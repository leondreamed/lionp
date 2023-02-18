import type { ExecaError } from 'execa';
import type { ListrTaskWrapper } from 'listr2';
export declare function handleNpmError(error: ExecaError, task: ListrTaskWrapper<{
    otp: string;
}, any>, message: string | ((opt: string) => Promise<unknown>), executor?: (otp: string) => Promise<unknown>): Promise<void>;
