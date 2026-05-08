import { getAddressEncoder, getProgramDerivedAddress, type Address, type Instruction } from '@solana/kit';
import { extension, getInitializeMintInstruction, getMintSize, getPreInitializeInstructionsForMintExtensions, TOKEN_2022_PROGRAM_ADDRESS, type ExtensionArgs } from '@solana-program/token-2022';

const EXTRA_ACCOUNT_METAS_SEED = new TextEncoder().encode('extra-account-metas');

export type Token2022MintConfig = Readonly<{
  mint: Address; mintAuthority: Address; transferHookProgram: Address; permanentDelegate: Address; metadataAddress?: Address; decimals?: number;
}>;

export type Token2022MintPlan = Readonly<{
  mint: Address; tokenProgram: typeof TOKEN_2022_PROGRAM_ADDRESS; decimals: number; mintSize: number;
  extensions: readonly ExtensionArgs[]; instructions: readonly Instruction[]; metadataPointer: Address; permanentDelegate: Address;
  transferHook: Readonly<{ programId: Address; extraAccountMetaList: Address; bump: number }>;
}>;

export function token2022Extensions(config: Token2022MintConfig): readonly ExtensionArgs[] {
  const metadataAddress = config.metadataAddress ?? config.mint;
  return [
    extension('TransferHook', { authority: config.mintAuthority, programId: config.transferHookProgram }),
    extension('MetadataPointer', { authority: config.mintAuthority, metadataAddress }),
    extension('PermanentDelegate', { delegate: config.permanentDelegate }),
  ];
}

export async function buildToken2022MintPlan(config: Token2022MintConfig): Promise<Token2022MintPlan> {
  const decimals = config.decimals ?? 6;
  const extensions = token2022Extensions(config);
  const [extraAccountMetaList, bump] = await getProgramDerivedAddress({
    programAddress: config.transferHookProgram,
    seeds: [EXTRA_ACCOUNT_METAS_SEED, getAddressEncoder().encode(config.mint)],
  });
  const instructions = [
    ...getPreInitializeInstructionsForMintExtensions(config.mint, extensions as ExtensionArgs[]),
    getInitializeMintInstruction({
      mint: config.mint,
      decimals,
      mintAuthority: config.mintAuthority,
      freezeAuthority: null,
    }),
  ];

  return {
    mint: config.mint,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    decimals,
    mintSize: getMintSize(extensions as ExtensionArgs[]),
    extensions,
    instructions,
    metadataPointer: config.metadataAddress ?? config.mint,
    permanentDelegate: config.permanentDelegate,
    transferHook: { programId: config.transferHookProgram, extraAccountMetaList, bump },
  };
}

export function permanentDelegateMatches(plan: Token2022MintPlan, expectedDelegate: Address): boolean {
  return plan.permanentDelegate === expectedDelegate;
}

export function token2022TransferAccounts(
  plan: Token2022MintPlan,
  sourceToken: Address,
  destinationToken: Address,
  authority: Address,
) {
  return {
    sourceToken,
    vault: destinationToken,
    collateralVault: destinationToken,
    contributor: authority,
    payer: authority,
    tokenProgram: plan.tokenProgram,
    transferHookExtraAccounts: plan.transferHook.extraAccountMetaList,
  };
}
