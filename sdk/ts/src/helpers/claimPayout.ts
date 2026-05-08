import { claimPayout as claimPayoutInstruction, type ClaimPayoutAccounts, type ClaimPayoutArgs } from '../generated/instructions/claimPayout.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type ClaimPayoutInput = StateHelperInput<ClaimPayoutAccounts, ClaimPayoutArgs>;

/**
 * Claims the current rotation payout using the Codama-generated `claimPayout` builder.
 *
 * @example
 * ```ts
 * import { claimPayout, createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * await claimPayout(client, { group: address('11111111111111111111111111111111'), rotationIndex: 0 });
 * ```
 */
export function claimPayout(client: SusuClient, input: ClaimPayoutInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'claimPayout', claimPayoutInstruction, input, {
    accountKeys: ['group', 'member', 'memberPosition', 'recipient', 'vault', 'receipt', 'tokenProgram', 'systemProgram'],
    argKeys: ['groupId', 'rotationIndex'],
  });
}
