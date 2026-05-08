import { address, type Address } from '@solana/kit';
import { createGroup, createSusuClient, deriveGroupPda, type Cluster } from '@susu/sdk';
import { pathToFileURL } from 'node:url';
import { createDemoMembers, createDryRunSquadsGateway, createSquadsMultisigSigner, createSquadsSusuRpc, SQUADS_PROGRAM_ADDRESS } from './multisigSigner.js';

const DEFAULT_RPC_ENDPOINT = 'https://api.devnet.solana.com';
const SUSU_ACCOUNTS = {
  systemProgram: address('11111111111111111111111111111111'),
  tokenProgram: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  associatedTokenProgram: address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
  rent: address('SysvarRent111111111111111111111111111111111'),
  mint: address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
} as const;

export type RunResult = Readonly<{ multisigPda: Address; vaultPda: Address; group: Address; verifiedCreator: Address; signature: string }>;

export async function run(): Promise<RunResult> {
  const env = readConfig();
  const members = await createDemoMembers(3);
  const gateway = createDryRunSquadsGateway();
  const multisig = await gateway.ensureMultisig({ existingMultisigPda: env.multisigPubkey, members, threshold: 2 });
  const squadsSigner = createSquadsMultisigSigner({ multisig, gateway, approvingMembers: members.slice(0, multisig.threshold) });
  const client = createSusuClient({
    cluster: env.cluster,
    rpc: createSquadsSusuRpc({ squadsSigner, endpoint: env.rpcEndpoint }),
    signer: squadsSigner,
  });
  const group = await deriveGroupPda(client.programId, squadsSigner.address, env.groupId);
  const signature = await createGroup(client, {
    creator: squadsSigner.address,
    payer: squadsSigner.address,
    group,
    ...SUSU_ACCOUNTS,
    groupId: env.groupId,
    n: members.length,
    contributionAmount: 50_000_000n,
    contributionPeriod: 2_592_000n,
    curveParams: { baseCollateralBps: 15_000, latePenaltyBps: 500 },
  });
  const verifiedCreator = gateway.getGroupCreator(group);
  if (verifiedCreator !== squadsSigner.address) throw new Error(`expected group creator ${squadsSigner.address}, got ${verifiedCreator ?? 'unknown'}`);
  const result = { multisigPda: multisig.multisigPda, vaultPda: multisig.vaultPda, group, verifiedCreator, signature };
  printResult(result, multisig.created);
  return result;
}

function readConfig(): Readonly<{ cluster: Cluster; rpcEndpoint: string; groupId: bigint; multisigPubkey?: Address }> {
  const env = process.env as Record<string, string | undefined>;
  const multisig = env.MULTISIG_PUBKEY?.trim();
  return {
    cluster: (env.CLUSTER?.trim() || 'devnet') as Cluster,
    rpcEndpoint: env.HELIUS_RPC_URL?.trim() || DEFAULT_RPC_ENDPOINT,
    groupId: BigInt(env.SUSU_GROUP_ID?.trim() || '67'),
    multisigPubkey: multisig ? address(multisig) : undefined,
  };
}

function printResult(result: RunResult, created: boolean): void {
  for (const line of [
    `Squads program: ${SQUADS_PROGRAM_ADDRESS}`,
    `Squads multisig (${created ? 'created' : 'existing'}): ${result.multisigPda}`,
    `Squads vault: ${result.vaultPda}`,
    `Susu group: ${result.group}`,
    `Verified Susu creator: ${result.verifiedCreator}`,
    `Vault transaction signature: ${result.signature}`,
  ]) console.log(line);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
