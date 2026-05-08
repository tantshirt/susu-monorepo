import { acceptInvite as acceptInviteInstruction, type AcceptInviteAccounts, type AcceptInviteArgs } from '../generated/instructions/acceptInvite.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type AcceptInviteInput = StateHelperInput<AcceptInviteAccounts, AcceptInviteArgs>;

/**
 * Accepts an invite for a member using the Codama-generated `acceptInvite` builder.
 *
 * @example
 * ```ts
 * import { acceptInvite, createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * await acceptInvite(client, { group: address('11111111111111111111111111111111'), member });
 * ```
 */
export function acceptInvite(client: SusuClient, input: AcceptInviteInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'acceptInvite', acceptInviteInstruction, input, {
    accountKeys: ['group', 'member', 'invitee', 'memberPosition', 'payer', 'systemProgram'],
    argKeys: [],
  });
}
