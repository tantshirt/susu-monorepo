import type { Address } from '@solana/kit';

import { assertClientReady, type SusuClient } from '../client.js';
import { queryParticipationHistory, type ParticipationRecord, type QueryRpc } from './queries.js';

export type QueryHistoryInput = Readonly<{
  wallet?: Address;
  member?: Address;
  programId?: Address;
  limit?: number;
  before?: Address;
}>;

/**
 * Queries decoded member participation history entries for a wallet.
 *
 * @example
 * ```ts
 * import { createSusuClient, queryHistory, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient().use(solanaDevnetRpc({ rpc }));
 * const history = await queryHistory(client, { wallet: address('11111111111111111111111111111112') });
 * ```
 */
export async function queryHistory(client: SusuClient, input: QueryHistoryInput): Promise<ParticipationRecord[]> {
  assertClientReady(client);
  const wallet = input.wallet ?? input.member;
  if (!wallet) {
    return [];
  }

  const records = await queryParticipationHistory(client.rpc as QueryRpc, input.programId ?? client.programId, wallet);
  const start = input.before ? records.findIndex((record) => record.group === input.before) + 1 : 0;
  const sliced = records.slice(Math.max(start, 0));
  return input.limit ? sliced.slice(0, input.limit) : sliced;
}
