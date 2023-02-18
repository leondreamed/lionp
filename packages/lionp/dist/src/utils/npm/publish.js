import { execa } from 'execa';
import { handleNpmError } from './handle-npm-error.js';
export const getPackagePublishArguments = (options) => {
    const args = ['publish'];
    if (options.tag) {
        args.push('--tag', options.tag);
    }
    if (options.otp) {
        args.push('--otp', options.otp);
    }
    if (options.publishScoped) {
        args.push('--access', 'public');
    }
    return args;
};
const pkgPublish = (pkgManager, options) => execa(pkgManager, getPackagePublishArguments(options));
export async function publish(context, pkgManager, task, options) {
    try {
        await pkgPublish(pkgManager, options);
    }
    catch (error) {
        await handleNpmError(error, task, (otp) => {
            context.otp = otp;
            return pkgPublish(pkgManager, { ...options, otp });
        });
    }
}
