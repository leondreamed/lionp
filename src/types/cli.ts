import type { Result, TypedFlags } from 'meow';
import type { getLionpCli } from '~/utils/cli.js';

export type LionpCliFlags = ReturnType<typeof getLionpCli> extends Result<
	infer Flags
>
	? TypedFlags<Flags>
	: never;
