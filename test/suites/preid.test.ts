import { expect,test } from 'vitest';

import { getPreReleasePrefix } from '~/utils/util.js';

test('get preId postfix', async () => {
	expect(await getPreReleasePrefix()).toEqual('');
});
