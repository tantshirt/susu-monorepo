import { argv, env } from 'node:process';
import { fileURLToPath } from 'node:url';
import { address, generateKeyPairSigner, type Address, type Signature } from '@solana/kit';
import { createGroup, createSusuClient, contribute, postCollateral, signer, solanaDevnetRpc, type SendInstructionsContext, type SusuRpc } from '@susu/sdk';
import { getMintToCheckedInstruction, TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { buildToken2022MintPlan, permanentDelegateMatches, token2022TransferAccounts, type Token2022MintPlan } from './mintSetup.js';

const DEFAULT_ENDPOINT = 'https://api.devnet.solana.com';
const MOCK_MINT = address('So11111111111111111111111111111111111111112');
const HOOK_PROGRAM = address('noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV');
const GROUP = address('2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N');
const VAULT_TOKEN = address('SysvarRent111111111111111111111111111111111');

export type DemoSummary = Readonly<{ endpoint: string; mintPlan: Token2022MintPlan; signatures: readonly Signature[]; permanentDelegateOk: boolean }>;

export async function runToken2022SusuDemo(endpoint = env.HELIUS_RPC_URL ?? DEFAULT_ENDPOINT): Promise<DemoSummary> {
  const payer = await generateKeyPairSigner();
  const permanentDelegate = await generateKeyPairSigner();
  const members = await Promise.all([0, 1, 2].map(async () => ({ owner: await generateKeyPairSigner(), token: await generateKeyPairSigner() })));
  const mintPlan = await buildToken2022MintPlan({
    mint: MOCK_MINT,
    mintAuthority: payer.address,
    transferHookProgram: HOOK_PROGRAM,
    permanentDelegate: permanentDelegate.address,
  });
  const rpc = createLoggingRpc(endpoint);
  const client = createSusuClient({ cluster: 'devnet' })
    .use(signer(payer))
    .use(solanaDevnetRpc({ endpoint, rpc }));

  const mintSignature = await sendToken2022MintPlan(rpc, mintPlan, payer.address);
  const supplySignature = await mintMockMemberSupply(rpc, mintPlan, payer.address, members.map((member) => member.token.address));
  const groupSignature = await createGroup(client, {
    creator: payer.address,
    payer: payer.address,
    group: GROUP,
    mint: mintPlan.mint,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    groupId: 2022n,
    n: 3,
    contributionAmount: 50_000_000n,
    contributionPeriod: 86_400n,
    simulate: false,
  });
  const memberSignatures: Signature[] = [];
  for (const [rotationSlot, member] of members.entries()) {
    const hookAccounts = token2022TransferAccounts(mintPlan, member.token.address, VAULT_TOKEN, member.owner.address);
    memberSignatures.push(await postCollateral(client, {
      accounts: { group: GROUP, member: member.owner.address, memberPosition: member.owner.address, ...hookAccounts },
      groupId: 2022n, rotationSlot, amount: 100_000_000n, simulate: false,
    }));
    memberSignatures.push(await contribute(client, {
      accounts: { group: GROUP, member: member.owner.address, memberPosition: member.owner.address, ...hookAccounts },
      groupId: 2022n, rotationIndex: rotationSlot, amount: 50_000_000n, simulate: false,
    }));
  }

  return {
    endpoint,
    mintPlan,
    signatures: [mintSignature, supplySignature, groupSignature, ...memberSignatures],
    permanentDelegateOk: permanentDelegateMatches(mintPlan, permanentDelegate.address),
  };
}

export async function mintMockMemberSupply(rpc: SusuRpc, plan: Token2022MintPlan, mintAuthority: Address, memberTokens: readonly Address[]): Promise<Signature> {
  const instructions = memberTokens.map((token) => getMintToCheckedInstruction({ mint: plan.mint, token, mintAuthority, amount: 150_000_000n, decimals: plan.decimals }));
  return sendToken2022Instructions(rpc, instructions, plan, mintAuthority, 'mintMockMemberSupply', { members: memberTokens.length });
}

export async function sendToken2022MintPlan(rpc: SusuRpc, plan: Token2022MintPlan, signerAddress: Address): Promise<Signature> {
  return sendToken2022Instructions(rpc, plan.instructions, plan, signerAddress, 'initializeToken2022Mint', {
    extensions: plan.extensions.map((item) => item.__kind),
    mintSize: plan.mintSize,
  });
}

async function sendToken2022Instructions(
  rpc: SusuRpc, instructions: readonly unknown[], plan: Token2022MintPlan, signerAddress: Address, helperName: string, args: Readonly<Record<string, unknown>>,
): Promise<Signature> {
  const sendInstructions = rpc.sendInstructions;
  if (!sendInstructions) throw new Error('RPC must expose sendInstructions');
  const result = await sendInstructions(instructions, {
    cluster: 'devnet',
    programId: plan.tokenProgram,
    signer: { address: signerAddress } as never,
    simulate: false,
    helperName,
    accounts: { mint: plan.mint, tokenProgram: plan.tokenProgram },
    args,
    computeUnits: 200_000,
    priorityFee: 0n,
  } satisfies SendInstructionsContext);
  return (typeof result === 'object' && result !== null && 'signature' in result ? result.signature : result) as Signature;
}

export function createLoggingRpc(endpoint: string): SusuRpc {
  let sent = 0;
  return {
    endpoint,
    getPriorityFeeEstimate: () => ({ priorityFeeEstimate: 1_000 }),
    simulateTransaction: () => ({ value: { err: null, logs: ['simulated token-extension transaction'] } }),
    sendInstructions: (instructions: readonly unknown[], context: SendInstructionsContext) => {
      sent += 1;
      console.log(`${context.helperName}: ${instructions.length} instruction(s) via ${endpoint}`);
      return { signature: `demo-token-extensions-signature-${sent}` as Signature };
    },
  };
}

if (fileURLToPath(import.meta.url) === argv[1]) {
  const summary = await runToken2022SusuDemo();
  console.log(`Token-2022 mint: ${summary.mintPlan.mint}`);
  console.log(`Extensions: ${summary.mintPlan.extensions.map((item) => item.__kind).join(', ')}`);
  console.log(`Hook extra-account PDA: ${summary.mintPlan.transferHook.extraAccountMetaList}`);
  console.log(`Permanent Delegate check: ${summary.permanentDelegateOk ? 'ok' : 'failed'}`);
  console.log(`Signatures: ${summary.signatures.join(', ')}`);
}
