import { execa } from 'execa';
import { handleNpmError } from './handle-npm-error.js';
export const getEnable2faArgs = (packageName, options) => {
    const args = ['access', '2fa-required', packageName];
    if (options.otp) {
        args.push('--otp', options.otp);
    }
    return args;
};
const npmEnable2fa = (packageName, options) => execa('npm', getEnable2faArgs(packageName, options));
export async function enable2fa(task, packageName, options) {
    try {
        await npmEnable2fa(packageName, options);
    }
    catch (error) {
        await handleNpmError(error, task, (otp) => npmEnable2fa(packageName, { otp }));
    }
}
