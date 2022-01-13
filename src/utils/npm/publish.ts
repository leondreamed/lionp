import type { ExecaError } from 'execa';
import { execa } from 'execa';
import type { ListrTaskWrapper } from 'listr2';
import { handleNpmError } from './handle-npm-error.js';
import type { LionpOptions } from '~/types/options';

export const getPackagePublishArguments = (options: LionpOptions) => {
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

const pkgPublish = (pkgManager: string, options: LionpOptions) =>
	execa(pkgManager, getPackagePublishArguments(options));

export async function publish(
	context: { otp: string },
	pkgManager: string,
	task: ListrTaskWrapper<Record<never, never>, any>,
	options: LionpOptions
) {
	try {
		await pkgPublish(pkgManager, options);
	} catch (error: unknown) {
		await handleNpmError(error as ExecaError, task, (otp: string) => {
			context.otp = otp;

			return pkgPublish(pkgManager, { ...options, otp });
		});
	}
}
