import type { AnyFlags, Result } from 'meow';
import type { LionpCliFlags } from '../types/cli.js';
import type { DefaultConfig, LionpConfig } from '../types/config.js';
import type { PossiblyUnversionedLionpOptions } from '../types/options.js';
export declare function getLionpOptions(config: Partial<LionpConfig> & DefaultConfig & Partial<LionpCliFlags>, cli: Result<AnyFlags>): Promise<PossiblyUnversionedLionpOptions>;
