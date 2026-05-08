import 'dotenv/config';
import { PrivyClient } from '@privy-io/node';
import { pathToFileURL } from 'node:url';
import { address, type Address } from '@solana/kit';
import {
  acceptInvite,
  contribute,
  createGroup,
  createSusuClient,
  postCollateral,
  signer,
  type Cluster,
  type SendInstructionsContext,
  type SusuInstruction,
  type SusuRpc,
} from '@susu/sdk';
import { createPrivySusuSigner, signerAddress, type PrivySolanaApi, type PrivySusuSigner } from './privyAdapter.js';

type Env = Record<string, string | undefined>;
type DemoMember = Readonly<{ label: string; signer: PrivySusuSigner; address: Address }>;
type DemoOptions = Readonly<{ env?: Env; privy?: Pick<PrivyClient, 'wallets'>; rpc?: SusuRpc; log?: (line: string) => void }>;
type DemoSignature = Readonly<{ step: string; signature: string }>;

export async function runPrivySusuDemo(options: DemoOptions = {}) {
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const cluster = readCluster(env);
  const privy = options.privy ?? new PrivyClient({
    appId: required(env.PRIVY_APP_ID, 'PRIVY_APP_ID'),
    appSecret: required(env.PRIVY_APP_SECRET, 'PRIVY_APP_SECRET'),
  });
  const caip2 = cluster === 'mainnet-beta' ? 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' : 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
  const solana = privy.wallets().solana() as PrivySolanaApi;
  const members = await createMembers(privy, solana, caip2, log);
  const signatures: DemoSignature[] = [];
  const rpc = options.rpc ?? createPrivyDemoRpc(env, log);
  const group = address(env.SUSU_GROUP_ADDRESS ?? '11111111111111111111111111111111');
  const mint = address(env.SUSU_MINT_ADDRESS ?? 'So11111111111111111111111111111111111111112');
  const base = { group, mint, contributionAmount: 25_000_000n, simulate: true };

  signatures.push({ step: 'createGroup', signature: await createGroup(clientFor(members[0], cluster, rpc), {
    ...base,
    creator: members[0].address,
    groupId: BigInt(env.SUSU_GROUP_ID ?? '6606'),
    n: 3,
    contributionPeriod: 30 * 24 * 60 * 60,
  }) });

  for (const member of members) {
    const client = clientFor(member, cluster, rpc);
    signatures.push({ step: `${member.label}:acceptInvite`, signature: await acceptInvite(client, { group, member: member.address, simulate: true }) });
    signatures.push({ step: `${member.label}:postCollateral`, signature: await postCollateral(client, { ...base, member: member.address }) });
    signatures.push({ step: `${member.label}:contribute`, signature: await contribute(client, { ...base, member: member.address }) });
  }

  log(`group ${group} complete with ${members.length} Privy members`);
  return { group, members: members.map(({ label, address }) => ({ label, address })), signatures };
}

async function createMembers(privy: Pick<PrivyClient, 'wallets'>, solana: PrivySolanaApi, caip2: string, log: (line: string) => void): Promise<DemoMember[]> {
  const members: DemoMember[] = [];
  for (const label of ['member-1', 'member-2', 'member-3']) {
    const wallet = await privy.wallets().create({ chain_type: 'solana' });
    const signer = createPrivySusuSigner({ wallet: { id: wallet.id, address: wallet.address }, solana, caip2 });
    members.push({ label, signer, address: signerAddress(signer) });
    log(`${label} Privy wallet ${wallet.address}`);
  }
  return members;
}

function clientFor(member: DemoMember, cluster: Cluster, rpc: SusuRpc) {
  return createSusuClient({ cluster, rpc }).use(signer(member.signer));
}

function createPrivyDemoRpc(env: Env, log: (line: string) => void): SusuRpc {
  return {
    endpoint: required(env.HELIUS_RPC_URL, 'HELIUS_RPC_URL'),
    simulateTransaction: async () => ({ value: { err: null, logs: ['susu with-privy simulation ok'] } }),
    sendInstructions: async (instructions: readonly SusuInstruction[], context: SendInstructionsContext) => {
      const susuSigner = context.signer as PrivySusuSigner | undefined;
      if (!susuSigner?.signSusuPayload) throw new Error('Susu helper requires a Privy signer');
      const signature = await susuSigner.signSusuPayload({ instructions, context });
      log(`${context.helperName} signature ${signature}`);
      return signature;
    },
  };
}

function readCluster(env: Env): Cluster {
  const cluster = env.CLUSTER ?? 'devnet';
  if (!['devnet', 'testnet', 'localnet', 'mainnet-beta'].includes(cluster)) throw new Error(`Unsupported CLUSTER=${cluster}`);
  return cluster as Cluster;
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required; copy .env.example to .env first`);
  return value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPrivySusuDemo().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
