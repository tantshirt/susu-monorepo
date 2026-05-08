import type { Address } from '@solana/kit';

import { assertClientReady, type SusuClient } from '../client.js';
import type { Group } from '../generated/accounts/Group.js';
import { getGroup as getGroupViaQuery, type QueryRpc } from './queries.js';

/**
 * Fetches and decodes a Group account using the generated Group decoder.
 *
 * @example
 * ```ts
 * import { createSusuClient, getGroup, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * const group = await getGroup(client, address('11111111111111111111111111111111'));
 * ```
 */
export async function getGroup(client: SusuClient, group: Address): Promise<Group | undefined> {
  assertClientReady(client);
  return getGroupViaQuery(client.rpc as QueryRpc, group);
}
