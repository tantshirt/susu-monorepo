import type { Address } from '@solana/kit';

import { assertClientReady, type SusuClient } from '../client.js';
import type { MemberPosition } from '../generated/accounts/MemberPosition.js';
import { getMemberPosition as getMemberPositionViaQuery, type QueryRpc } from './queries.js';

export type GetMemberPositionInput = Readonly<{
  group: Address;
  member: Address;
  programId?: Address;
}>;

/**
 * Derives, fetches, and decodes a MemberPosition account using generated seed and account helpers.
 *
 * @example
 * ```ts
 * import { createSusuClient, getMemberPosition, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * const position = await getMemberPosition(client, {
 *   group: address('11111111111111111111111111111111'),
 *   member: address('11111111111111111111111111111112'),
 * });
 * ```
 */
export async function getMemberPosition(
  client: SusuClient,
  input: GetMemberPositionInput,
): Promise<MemberPosition | undefined> {
  assertClientReady(client);
  return getMemberPositionViaQuery(client.rpc as QueryRpc, input.programId ?? client.programId, input.group, input.member);
}
