import { createGroup as createGroupInstruction, type CreateGroupAccounts, type CreateGroupArgs } from '../generated/instructions/createGroup.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type CreateGroupInput = StateHelperInput<CreateGroupAccounts, CreateGroupArgs>;

/**
 * Creates a Susu group using the Codama-generated `createGroup` builder.
 *
 * @example
 * ```ts
 * import { createGroup, createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient().use(solanaDevnetRpc({ rpc }));
 * await createGroup(client, {
 *   creator: address('11111111111111111111111111111111'),
 *   groupId: 1n,
 *   n: 5,
 *   contributionAmount: 50_000_000n,
 * });
 * ```
 */
export function createGroup(client: SusuClient, input: CreateGroupInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'createGroup', createGroupInstruction, input, {
    accountKeys: ['creator', 'payer', 'group', 'systemProgram', 'tokenProgram', 'associatedTokenProgram', 'rent'],
    argKeys: ['groupId', 'n', 'contributionAmount', 'contributionPeriod', 'mint', 'curveParams'],
  });
}
