import {
  address,
  createSolanaRpc,
  type Address,
  type Signature,
  type TransactionSigner,
} from '@solana/kit';
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

export const DEFAULT_SUSU_PROGRAM_ID = address('2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N');
export const DEFAULT_COMPUTE_UNITS = 200_000;

export type Cluster = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta' | (string & {});
export type TransactionSignature = Signature;
export type SusuInstruction = unknown;
export type PriorityFee = number | bigint;

export type RpcSendable<T> = T | Promise<T> | Readonly<{ send: () => Promise<T> }>;

export type PriorityFeeEstimateResponse = Readonly<{
  priorityFeeEstimate?: PriorityFee;
  microLamports?: PriorityFee;
  result?: Readonly<{
    priorityFeeEstimate?: PriorityFee;
    microLamports?: PriorityFee;
  }>;
}>;

export type SendInstructionsContext = Readonly<{
  cluster: Cluster;
  programId: Address;
  signer?: TransactionSigner;
  simulate?: boolean;
  helperName: string;
  accounts: Readonly<Record<string, unknown>>;
  args: Readonly<Record<string, unknown>>;
  computeUnits: number;
  priorityFee: bigint;
}>;

export type SusuRpc = Readonly<{
  getPriorityFeeEstimate?: (
    request: Readonly<{ instructions: readonly SusuInstruction[]; programId: Address }>,
  ) => RpcSendable<PriorityFeeEstimateResponse | PriorityFee>;
  sendInstructions?: (
    instructions: readonly SusuInstruction[],
    context: SendInstructionsContext,
  ) => RpcSendable<TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>>;
  sendTransaction?: (
    transaction: Readonly<{ instructions: readonly SusuInstruction[]; context: SendInstructionsContext }>,
  ) => RpcSendable<TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>>;
  getAccountInfo?: (...args: readonly unknown[]) => unknown;
  getProgramAccounts?: (...args: readonly unknown[]) => unknown;
}>;

export type SusuClientOptions = Readonly<{
  cluster?: Cluster;
  rpc?: SusuRpc;
  signer?: TransactionSigner;
  programId?: Address;
  computeUnits?: number;
  priorityFee?: PriorityFee;
}>;

export type SusuPlugin = (client: SusuClient) => Partial<SusuClient> | void;

export class SusuClientConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SusuClientConfigError';
  }
}

export class SusuTransactionSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SusuTransactionSendError';
  }
}

export class SusuClient {
  readonly cluster?: Cluster;
  readonly rpc?: SusuRpc;
  readonly signer?: TransactionSigner;
  readonly programId: Address;
  readonly computeUnits: number;
  readonly priorityFee?: PriorityFee;

  constructor(options: SusuClientOptions = {}) {
    this.cluster = options.cluster;
    this.rpc = options.rpc;
    this.signer = options.signer;
    this.programId = options.programId ?? DEFAULT_SUSU_PROGRAM_ID;
    this.computeUnits = options.computeUnits ?? DEFAULT_COMPUTE_UNITS;
    this.priorityFee = options.priorityFee;
  }

  use(plugin: SusuPlugin): SusuClient {
    const patch = plugin(this) ?? {};
    return new SusuClient({
      cluster: patch.cluster ?? this.cluster,
      rpc: patch.rpc ?? this.rpc,
      signer: patch.signer ?? this.signer,
      programId: patch.programId ?? this.programId,
      computeUnits: patch.computeUnits ?? this.computeUnits,
      priorityFee: patch.priorityFee ?? this.priorityFee,
    });
  }
}

/**
 * Creates a fluent Susu SDK client.
 *
 * @example
 * ```ts
 * import { createSusuClient, signer, solanaDevnetRpc } from '@susu/sdk';
 * import { generateKeyPairSigner } from '@solana/kit';
 *
 * const authority = await generateKeyPairSigner();
 * const client = createSusuClient()
 *   .use(signer(authority))
 *   .use(solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }));
 * ```
 */
export function createSusuClient(options: SusuClientOptions = {}): SusuClient {
  return new SusuClient(options);
}

/**
 * Adds a kit transaction signer to a fluent Susu client.
 *
 * @example
 * ```ts
 * import { createSusuClient, signer } from '@susu/sdk';
 * import { generateKeyPairSigner } from '@solana/kit';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(signer(await generateKeyPairSigner()));
 * ```
 */
export function signer(value: TransactionSigner): SusuPlugin {
  return () => ({ signer: value });
}

/**
 * Adds a devnet RPC endpoint or RPC object to a fluent Susu client.
 *
 * @example
 * ```ts
 * import { createSusuClient, solanaDevnetRpc } from '@susu/sdk';
 *
 * const client = createSusuClient().use(
 *   solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }),
 * );
 * ```
 */
export function solanaDevnetRpc(options: Readonly<{ endpoint?: string; rpc?: SusuRpc }> = {}): SusuPlugin {
  return () => ({
    cluster: 'devnet',
    rpc: options.rpc ?? (createSolanaRpc(options.endpoint ?? 'https://api.devnet.solana.com') as unknown as SusuRpc),
  });
}

/**
 * Adds an explicit cluster name to a fluent Susu client.
 *
 * @example
 * ```ts
 * import { cluster, createSusuClient } from '@susu/sdk';
 *
 * const client = createSusuClient().use(cluster('mainnet-beta'));
 * ```
 */
export function cluster(value: Cluster): SusuPlugin {
  return () => ({ cluster: value });
}

export function assertClientReady(client: SusuClient): asserts client is SusuClient & {
  cluster: Cluster;
  rpc: SusuRpc;
} {
  if (!client.cluster) {
    throw new SusuClientConfigError('Susu client requires a cluster before helpers can run');
  }
  if (!client.rpc) {
    throw new SusuClientConfigError('Susu client requires an rpc before helpers can run');
  }
}

export type ComputeBudgetOptions = Readonly<{
  computeUnits?: number;
  priorityFee?: PriorityFee;
}>;

export async function sendInstructions(
  client: SusuClient,
  instructions: readonly SusuInstruction[],
  context: Omit<SendInstructionsContext, 'cluster' | 'programId' | 'signer' | 'computeUnits' | 'priorityFee'> &
    ComputeBudgetOptions,
): Promise<TransactionSignature> {
  assertClientReady(client);
  const computeUnits = context.computeUnits ?? client.computeUnits ?? DEFAULT_COMPUTE_UNITS;
  const priorityFee = await resolvePriorityFee(client, instructions, context.priorityFee);
  const budgetedInstructions = [
    getSetComputeUnitLimitInstruction({ units: computeUnits }),
    getSetComputeUnitPriceInstruction({ microLamports: priorityFee }),
    ...instructions,
  ];
  const sendContext: SendInstructionsContext = {
    cluster: client.cluster,
    programId: client.programId,
    signer: client.signer,
    simulate: context.simulate,
    helperName: context.helperName,
    accounts: context.accounts,
    args: context.args,
    computeUnits,
    priorityFee,
  };

  const sendInstructionsMethod = client.rpc.sendInstructions;
  if (sendInstructionsMethod) {
    return normalizeSignature(await resolveSendable(sendInstructionsMethod(budgetedInstructions, sendContext)));
  }

  const sendTransactionMethod = client.rpc.sendTransaction;
  if (sendTransactionMethod) {
    return normalizeSignature(await resolveSendable(sendTransactionMethod({ instructions: budgetedInstructions, context: sendContext })));
  }

  throw new SusuTransactionSendError('Susu RPC must expose sendInstructions or sendTransaction for state-changing helpers');
}

async function resolvePriorityFee(
  client: SusuClient & { rpc: SusuRpc },
  instructions: readonly SusuInstruction[],
  override?: PriorityFee,
): Promise<bigint> {
  if (override !== undefined) {
    return BigInt(override);
  }
  if (client.priorityFee !== undefined) {
    return BigInt(client.priorityFee);
  }

  const estimator = client.rpc.getPriorityFeeEstimate;
  if (!estimator) {
    return 0n;
  }

  const response = await resolveSendable(estimator({ instructions, programId: client.programId }));
  if (typeof response === 'number' || typeof response === 'bigint') {
    return BigInt(response);
  }

  const estimate = response.priorityFeeEstimate ?? response.microLamports ?? response.result?.priorityFeeEstimate ?? response.result?.microLamports ?? 0;
  return BigInt(estimate);
}

async function resolveSendable<T>(value: RpcSendable<T>): Promise<T> {
  const resolved = await value;
  if (isSendable(resolved)) {
    return resolved.send();
  }
  return resolved;
}

function isSendable<T>(value: T | Readonly<{ send: () => Promise<T> }>): value is Readonly<{ send: () => Promise<T> }> {
  return typeof value === 'object' && value !== null && 'send' in value && typeof value.send === 'function';
}

function normalizeSignature(
  value: TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>,
): TransactionSignature {
  const raw = typeof value === 'object' && value !== null && 'signature' in value ? value.signature : value;
  return raw as TransactionSignature;
}
