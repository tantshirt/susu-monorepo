import { topUpCollateral as topUpCollateralInstruction, type TopUpCollateralAccounts, type TopUpCollateralArgs } from '../generated/instructions/topUpCollateral.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type TopUpCollateralInput = StateHelperInput<TopUpCollateralAccounts, TopUpCollateralArgs>;

/**
 * Tops up a member's collateral using the Codama-generated `topUpCollateral` builder.
 *
 * @example
 * ```ts
 * import { createSusuClient, solanaDevnetRpc, topUpCollateral } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient().use(solanaDevnetRpc({ rpc }));
 * await topUpCollateral(client, { group: address('11111111111111111111111111111111'), amount: 25_000_000n });
 * ```
 */
export function topUpCollateral(client: SusuClient, input: TopUpCollateralInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'topUpCollateral', topUpCollateralInstruction, input, {
    accountKeys: ['group', 'member', 'memberPosition', 'payer', 'sourceToken', 'collateralVault', 'tokenProgram'],
    argKeys: ['groupId', 'amount'],
  });
}
