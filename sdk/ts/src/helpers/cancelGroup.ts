import { cancelGroup as cancelGroupInstruction, type CancelGroupAccounts, type CancelGroupArgs } from '../generated/instructions/cancelGroup.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type CancelGroupInput = StateHelperInput<CancelGroupAccounts, CancelGroupArgs>;

/**
 * Cancels a forming group using the Codama-generated `cancelGroup` builder.
 *
 * @example
 * ```ts
 * import { cancelGroup, createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * await cancelGroup(client, { group: address('11111111111111111111111111111111'), groupId: 1n });
 * ```
 */
export function cancelGroup(client: SusuClient, input: CancelGroupInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'cancelGroup', cancelGroupInstruction, input, {
    accountKeys: ['group', 'creator', 'authority'],
    argKeys: ['groupId'],
  });
}
