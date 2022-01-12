import type { ExecaError } from 'execa';
import { execa } from 'execa';
import { handleNpmError } from './handle-npm-error.js';

export const getEnable2faArgs = (
	packageName: string,
	options: { otp?: string }
) => {
	const args = ['access', '2fa-required', packageName];

	if (options.otp) {
		args.push('--otp', options.otp);
	}

	return args;
};

const npmEnable2fa = (packageName: string, options: { otp: string }) =>
	execa('npm', getEnable2faArgs(packageName, options));

export async function enable2fa(
	task: { title: string },
	packageName: string,
	options: { otp: string }
) {
	try {
		await npmEnable2fa(packageName, options);
	} catch (error: unknown) {
		await handleNpmError(error as ExecaError, task, (otp: string) =>
			npmEnable2fa(packageName, { otp })
		);
	}
}
