import { packageDirectory } from 'pkg-dir';
import { cosmiconfig } from 'cosmiconfig';
import type { LionpOptions } from '~/types/options';

export const getConfig = async (): Promise<LionpOptions> => {
	const searchDir = await packageDirectory();
	const searchPlaces = [
		'.np-config.json',
		'.np-config.js',
		'.np-config.cjs',
		'package.json',
	];
	const explorer = cosmiconfig('np', {
		searchPlaces,
		stopDir: searchDir,
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { config } = (await explorer.search(searchDir)) ?? {};

	return config as LionpOptions;
};
