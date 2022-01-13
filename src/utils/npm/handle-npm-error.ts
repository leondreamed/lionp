import chalk from 'chalk';
import type { ExecaError } from 'execa';
import type { ListrTaskWrapper } from 'listr2';

export async function handleNpmError(
	error: ExecaError,
	task: ListrTaskWrapper<Record<never, never>, any>,
	message: string | ((opt: string) => Promise<unknown>),
	executor?: (otp: string) => Promise<unknown>
): Promise<void> {
	if (typeof message === 'function') {
		executor = message;
	}

	// `one-time pass` is for npm
	if (error.stderr.includes('one-time pass')) {
		const { title } = task;
		task.title = `${title} ${chalk.yellow('(waiting for input…)')}`;

		try {
			const otp = await task.prompt<string>({
				message: 'Enter OTP:',
				type: 'Text',
			});
			await executor?.(otp);
		} catch (error: unknown) {
			return handleNpmError(
				error as ExecaError,
				task,
				'OTP was incorrect, try again:',
				executor
			);
		}
	} else {
		throw error;
	}
}
