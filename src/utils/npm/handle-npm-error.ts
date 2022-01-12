import listrInput from 'listr-input';
import chalk from 'chalk';
import type { ObservableInput } from 'rxjs';
import { throwError } from 'rxjs';
// eslint-disable-next-line node/file-extension-in-import
import { catchError } from 'rxjs/operators';
import type { ExecaError } from 'execa';

export const handleNpmError = (
	error: ExecaError,
	task: { title: string },
	// eslint-disable-next-line @typescript-eslint/ban-types
	message: string | Function,
	// eslint-disable-next-line @typescript-eslint/ban-types
	executor?: Function
): ObservableInput<unknown> => {
	if (typeof message === 'function') {
		executor = message;
	}

	// `one-time pass` is for npm and `Two factor authentication` is for Yarn.
	if (
		error.stderr.includes('one-time pass') ||
		error.stdout.includes('Two factor authentication')
	) {
		const { title } = task;
		task.title = `${title} ${chalk.yellow('(waiting for input…)')}`;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
		return listrInput('Enter OTP:', {
			done: (otp: string) => {
				task.title = title;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return executor?.(otp);
			},
			autoSubmit: (value: string) => value.length === 6,
		}).pipe(
			catchError((error: ExecaError) =>
				handleNpmError(error, task, 'OTP was incorrect, try again:', executor)
			)
		);
	}

	return throwError(() => error);
};
