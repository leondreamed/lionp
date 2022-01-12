import { execa } from 'execa';
import { from } from 'rxjs';
// eslint-disable-next-line node/file-extension-in-import
import { catchError } from 'rxjs/operators';
import { handleNpmError } from './handle-npm-error.js';

export const getEnable2faArgs = (
	packageName: string,
	options: { otp: string }
) => {
	const args = ['access', '2fa-required', packageName];

	if (options.otp) {
		args.push('--otp', options.otp);
	}

	return args;
};

const npmEnable2fa = (packageName: string, options: { otp: string }) =>
	execa('npm', getEnable2faArgs(packageName, options));

export const enable2fa = (
	task: { title: string },
	packageName: string,
	options: { otp: string }
) =>
	from(npmEnable2fa(packageName, options)).pipe(
		catchError((error) =>
			handleNpmError(error, task, (otp: string) =>
				npmEnable2fa(packageName, { otp })
			)
		)
	);
