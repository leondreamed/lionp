import chalk from 'chalk';
import type { ExecaError } from 'execa';
import inquirer from 'inquirer';

export async function handleNpmError(
	error: ExecaError,
	task: { title: string },
	message: string | ((opt: string) => Promise<unknown>),
	executor?: (otp: string) => Promise<unknown>
): Promise<void> {
	if (typeof message === 'function') {
		executor = message;
	}

	// `one-time pass` is for npm
	if (error.stderr?.includes('one-time pass')) {
		const { title } = task;
		task.title = `${title} ${chalk.yellow('(waiting for input…)')}`;

		try {
			const { otp } = await inquirer.prompt<{ otp: string }>([
				{
					name: 'otp',
					message: 'Enter OTP:',
					type: 'input',
				},
			]);
			await executor?.(otp);
		} catch (error: unknown) {
			return handleNpmError(
				error as ExecaError,
				task,
				'OTP was incorrect, try again:',
				executor
			);
		}
	}
}
