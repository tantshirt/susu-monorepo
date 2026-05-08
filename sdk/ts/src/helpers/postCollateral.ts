import { postCollateral as postCollateralInstruction, type PostCollateralAccounts, type PostCollateralArgs } from '../generated/instructions/postCollateral.js';
import type { SusuClient, TransactionSignature } from '../client.js';
import { sendStateChangingInstruction, type StateHelperInput } from './internal/state.js';

export type PostCollateralInput = StateHelperInput<PostCollateralAccounts, PostCollateralArgs>;

/**
 * Posts collateral for a member position using the Codama-generated `postCollateral` builder.
 *
 * @example
 * ```ts
 * import { createSusuClient, postCollateral, solanaDevnetRpc } from '@susu/sdk';
 * import { address } from '@solana/kit';
 *
 * const client = createSusuClient().use(solanaDevnetRpc({ rpc }));
 * await postCollateral(client, { group: address('11111111111111111111111111111111'), amount: 100_000_000n });
 * ```
 */
export function postCollateral(client: SusuClient, input: PostCollateralInput): Promise<TransactionSignature> {
  return sendStateChangingInstruction(client, 'postCollateral', postCollateralInstruction, input, {
    accountKeys: ['group', 'member', 'memberPosition', 'payer', 'sourceToken', 'collateralVault', 'tokenProgram'],
    argKeys: ['groupId', 'rotationSlot', 'amount'],
  });
}
