import { contribute as contributeInstruction, type ContributeAccounts, type ContributeArgs } from '../generated/instructions/contribute.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type ContributeInput = StateHelperInput<ContributeAccounts, ContributeArgs>;

/**
 * Records a contribution using the Codama-generated `contribute` builder.
 *
 * @example
 * ```ts
 * import { contribute, createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient().use(solanaDevnetRpc({ rpc }));
 * await contribute(client, { group: address('11111111111111111111111111111111'), amount: 50_000_000n });
 * ```
 */
export function contribute(client: SusuClient, input: ContributeInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'contribute', contributeInstruction, input, {
    accountKeys: ['group', 'member', 'memberPosition', 'contributor', 'sourceToken', 'vault', 'tokenProgram'],
    argKeys: ['groupId', 'amount', 'rotationIndex'],
  });
}
