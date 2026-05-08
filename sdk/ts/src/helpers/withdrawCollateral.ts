import { withdrawCollateral as withdrawCollateralInstruction, type WithdrawCollateralAccounts, type WithdrawCollateralArgs } from '../generated/instructions/withdrawCollateral.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type WithdrawCollateralInput = StateHelperInput<WithdrawCollateralAccounts, WithdrawCollateralArgs>;

/**
 * Withdraws excess or unlocked collateral using the Codama-generated `withdrawCollateral` builder.
 *
 * @example
 * ```ts
 * import { createSusuClient, solanaDevnetRpc, withdrawCollateral } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
 * await withdrawCollateral(client, { group: address('11111111111111111111111111111111'), amount: 10_000_000n });
 * ```
 */
export function withdrawCollateral(client: SusuClient, input: WithdrawCollateralInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'withdrawCollateral', withdrawCollateralInstruction, input, {
    accountKeys: ['group', 'member', 'memberPosition', 'recipient', 'collateralVault', 'tokenProgram'],
    argKeys: ['groupId', 'amount'],
  });
}
