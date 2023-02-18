import chalk from 'chalk';
export async function handleNpmError(error, task, message, executor) {
    if (typeof message === 'function') {
        executor = message;
    }
    // `one-time pass` is for npm
    if (error.stderr.includes('one-time pass')) {
        const { title } = task;
        task.title = `${title} ${chalk.yellow('(waiting for input…)')}`;
        try {
            const otp = await task.prompt({
                message: 'Enter OTP:',
                type: 'Text',
            });
            await executor?.(otp);
        }
        catch (error) {
            return handleNpmError(error, task, 'OTP was incorrect, try again:', executor);
        }
    }
    else {
        throw error;
    }
}
