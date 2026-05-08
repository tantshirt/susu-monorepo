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
import { SusuClusterError, SusuRpcError, type SusuRpcErrorDetails } from './errors.js';
import { extractRpcEndpoint, extractRpcStatus } from './lib/rpcErrors.js';

export const DEFAULT_SUSU_PROGRAM_ID = address('2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N');
export const DEFAULT_COMPUTE_UNITS = 200_000;
export const MAINNET_BETA_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

export type Cluster = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta';
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

export type SusuTransaction = Readonly<{
  instructions: readonly SusuInstruction[];
  context: SendInstructionsContext;
}>;

export type SusuSimulationResponse = Readonly<{
  value?: Readonly<{
    err?: unknown;
    logs?: readonly string[] | null;
    programLogs?: readonly string[] | null;
  }>;
  err?: unknown;
  error?: unknown;
  logs?: readonly string[] | null;
  programLogs?: readonly string[] | null;
  result?: unknown;
}>;

export type SusuRpc = Readonly<{
  endpoint?: string;
  url?: string;
  getPriorityFeeEstimate?: (
    request: Readonly<{ instructions: readonly SusuInstruction[]; programId: Address }>,
  ) => RpcSendable<PriorityFeeEstimateResponse | PriorityFee>;
  getGenesisHash?: () => RpcSendable<string | Readonly<{ genesisHash?: string; result?: string; value?: string }>>;
  simulateTransaction?: (transaction: SusuTransaction) => RpcSendable<SusuSimulationResponse>;
  sendInstructions?: (
    instructions: readonly SusuInstruction[],
    context: SendInstructionsContext,
  ) => RpcSendable<TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>>;
  sendTransaction?: (
    transaction: SusuTransaction,
  ) => RpcSendable<TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>>;
  getAccountInfo?: (...args: readonly unknown[]) => unknown;
  getProgramAccounts?: (...args: readonly unknown[]) => unknown;
}>;

export type SusuClientOptions = Readonly<{
  cluster: Cluster;
  rpc?: SusuRpc;
  signer?: TransactionSigner;
  programId?: Address;
  computeUnits?: number;
  priorityFee?: PriorityFee;
}>;

export type SusuPlugin = (client: SusuClient) => Partial<SusuClient> | void;

export class SusuClientConfigError extends SusuRpcError {
  constructor(message: string, details: SusuRpcErrorDetails = {}) {
    super(message, details);
    this.name = 'SusuClientConfigError';
  }
}

export class SusuTransactionSendError extends SusuRpcError {
  constructor(message: string, details: SusuRpcErrorDetails = {}) {
    super(message, details);
    this.name = 'SusuTransactionSendError';
  }
}

export class SusuClient {
  readonly cluster: Cluster;
  readonly rpc?: SusuRpc;
  readonly signer?: TransactionSigner;
  readonly programId: Address;
  readonly computeUnits: number;
  readonly priorityFee?: PriorityFee;

  constructor(options: SusuClientOptions) {
    const cluster = requireExplicitCluster(options?.cluster);
    assertKnownMainnetEndpointMatchesCluster(cluster, options?.rpc);

    this.cluster = cluster;
    this.rpc = options.rpc;
    this.signer = options.signer;
    this.programId = options.programId ?? DEFAULT_SUSU_PROGRAM_ID;
    this.computeUnits = options.computeUnits ?? DEFAULT_COMPUTE_UNITS;
    this.priorityFee = options.priorityFee;
  }

  use(plugin: SusuPlugin): SusuClient {
    const patch = plugin(this) ?? {};
    const nextCluster = hasOwn(patch, 'cluster') ? patch.cluster : this.cluster;
    return new SusuClient({
      cluster: nextCluster as Cluster,
      rpc: hasOwn(patch, 'rpc') ? patch.rpc : this.rpc,
      signer: hasOwn(patch, 'signer') ? patch.signer : this.signer,
      programId: hasOwn(patch, 'programId') ? patch.programId : this.programId,
      computeUnits: hasOwn(patch, 'computeUnits') ? patch.computeUnits : this.computeUnits,
      priorityFee: hasOwn(patch, 'priorityFee') ? patch.priorityFee : this.priorityFee,
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
 * const client = createSusuClient({ cluster: 'devnet' })
 *   .use(signer(authority))
 *   .use(solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }));
 * ```
 */
export function createSusuClient(options: SusuClientOptions): SusuClient {
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
 * const client = createSusuClient({ cluster: 'devnet' }).use(
 *   solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }),
 * );
 * ```
 */
export function solanaDevnetRpc(options: Readonly<{ endpoint?: string; rpc?: SusuRpc }> = {}): SusuPlugin {
  const endpoint = options.endpoint ?? 'https://api.devnet.solana.com';
  const rpc = options.rpc ?? (createSolanaRpc(endpoint) as unknown as SusuRpc);
  return () => ({
    cluster: 'devnet',
    rpc: withRpcEndpointMetadata(rpc, endpoint),
  });
}

/**
 * Adds an explicit cluster name to a fluent Susu client.
 *
 * @example
 * ```ts
 * import { cluster, createSusuClient } from '@susu/sdk';
 *
 * const client = createSusuClient({ cluster: 'devnet' }).use(cluster('mainnet-beta'));
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
    throw new SusuClusterError('Susu client requires an explicit cluster before helpers can run', {
      reason: 'missing-cluster',
      expected: 'localnet | devnet | testnet | mainnet-beta',
    });
  }
  if (!client.rpc) {
    throw new SusuClientConfigError('Susu client requires an rpc before helpers can run');
  }
}

export type ComputeBudgetOptions = Readonly<{
  computeUnits?: number;
  priorityFee?: PriorityFee;
}>;

export type SusuRpcMethodName =
  | 'getGenesisHash'
  | 'getPriorityFeeEstimate'
  | 'sendInstructions'
  | 'sendTransaction'
  | 'simulateTransaction';

export async function assertMainnetResolutionMatchesCluster(
  client: SusuClient,
): Promise<void> {
  assertClientReady(client);
  assertKnownMainnetEndpointMatchesCluster(client.cluster, client.rpc);

  const getGenesisHash = getOwnRpcMethod(client.rpc, 'getGenesisHash');
  if (!getGenesisHash) {
    return;
  }

  let genesisHash: string | undefined;
  try {
    genesisHash = normalizeGenesisHash(await resolveSendable(getGenesisHash()));
  } catch (error) {
    throw new SusuRpcError('Susu RPC getGenesisHash failed', {
      endpoint: extractRpcEndpoint(client.rpc),
      status: extractRpcStatus(error),
      cause: error,
    });
  }

  if (genesisHash === MAINNET_BETA_GENESIS_HASH && client.cluster !== 'mainnet-beta') {
    throw new SusuClusterError('RPC resolves to mainnet-beta; pass cluster: "mainnet-beta" explicitly to send', {
      reason: 'mainnet-mismatch',
      expected: 'mainnet-beta',
      actual: client.cluster,
      cluster: client.cluster,
      genesisHash,
    });
  }
}

export function prependComputeBudgetInstructions(
  instructions: readonly SusuInstruction[],
  computeUnits: number,
  priorityFee: bigint,
): readonly SusuInstruction[] {
  return [
    getSetComputeUnitLimitInstruction({ units: computeUnits }),
    getSetComputeUnitPriceInstruction({ microLamports: priorityFee }),
    ...instructions,
  ];
}

export async function resolvePriorityFee(
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

  const estimator = getOwnRpcMethod(client.rpc, 'getPriorityFeeEstimate');
  if (!estimator) {
    return 0n;
  }

  let response: PriorityFeeEstimateResponse | PriorityFee;
  try {
    response = await resolveSendable(estimator({ instructions, programId: client.programId }));
  } catch (error) {
    throw new SusuRpcError('Susu RPC priority fee estimation failed', {
      endpoint: extractRpcEndpoint(client.rpc),
      status: extractRpcStatus(error),
      cause: error,
    });
  }

  if (typeof response === 'number' || typeof response === 'bigint') {
    return BigInt(response);
  }

  const estimate = response.priorityFeeEstimate ?? response.microLamports ?? response.result?.priorityFeeEstimate ?? response.result?.microLamports ?? 0;
  return BigInt(estimate);
}

export async function resolveSendable<T>(value: RpcSendable<T>): Promise<T> {
  const resolved = await value;
  if (isSendable(resolved)) {
    return resolved.send();
  }
  return resolved;
}

function isSendable<T>(value: T | Readonly<{ send: () => Promise<T> }>): value is Readonly<{ send: () => Promise<T> }> {
  return typeof value === 'object' && value !== null && 'send' in value && typeof value.send === 'function';
}

function hasOwn<K extends PropertyKey>(value: object, key: K): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function getOwnRpcMethod<K extends SusuRpcMethodName>(
  rpc: SusuRpc,
  method: K,
): NonNullable<SusuRpc[K]> | undefined {
  if (!Object.prototype.hasOwnProperty.call(rpc, method)) {
    return undefined;
  }

  const value = rpc[method];
  return typeof value === 'function' ? (value as NonNullable<SusuRpc[K]>) : undefined;
}

export function normalizeSignature(
  value: TransactionSignature | string | Readonly<{ signature: TransactionSignature | string }>,
): TransactionSignature {
  const raw = typeof value === 'object' && value !== null && 'signature' in value ? value.signature : value;
  return raw as TransactionSignature;
}

function requireExplicitCluster(clusterValue: Cluster | undefined): Cluster {
  if (typeof clusterValue !== 'string' || clusterValue.trim() === '') {
    throw new SusuClusterError('createSusuClient requires an explicit cluster', {
      reason: 'missing-cluster',
      expected: 'localnet | devnet | testnet | mainnet-beta',
    });
  }

  if (!isSupportedCluster(clusterValue)) {
    throw new SusuClusterError(`Unsupported Susu cluster "${clusterValue}"`, {
      reason: 'unsupported-cluster',
      expected: 'localnet | devnet | testnet | mainnet-beta',
      actual: clusterValue,
      cluster: clusterValue,
    });
  }

  return clusterValue;
}

function isSupportedCluster(value: string): value is Cluster {
  return value === 'localnet' || value === 'devnet' || value === 'testnet' || value === 'mainnet-beta';
}

function assertKnownMainnetEndpointMatchesCluster(clusterValue: Cluster, rpc?: SusuRpc): void {
  const endpoint = extractRpcEndpoint(rpc);
  if (!endpoint || !isKnownMainnetEndpoint(endpoint)) {
    return;
  }

  if (clusterValue !== 'mainnet-beta') {
    throw new SusuClusterError('RPC endpoint appears to target mainnet-beta; pass cluster: "mainnet-beta" explicitly to send', {
      reason: 'mainnet-mismatch',
      expected: 'mainnet-beta',
      actual: clusterValue,
      cluster: clusterValue,
      endpoint,
    });
  }
}

function isKnownMainnetEndpoint(endpoint: string): boolean {
  const normalized = endpoint.toLowerCase();
  return (
    normalized.includes('api.mainnet-beta.solana.com') ||
    normalized.includes('mainnet-beta') ||
    normalized.includes('mainnet.helius-rpc.com') ||
    normalized.includes('solana-mainnet') ||
    normalized.includes('mainnet.solana')
  );
}

function normalizeGenesisHash(value: string | Readonly<{ genesisHash?: string; result?: string; value?: string }>): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return value.genesisHash ?? value.result ?? value.value;
}

function withRpcEndpointMetadata(rpc: SusuRpc, endpoint: string): SusuRpc {
  if (Object.prototype.hasOwnProperty.call(rpc, 'endpoint')) {
    return rpc;
  }

  try {
    Object.defineProperty(rpc, 'endpoint', {
      configurable: true,
      enumerable: true,
      value: endpoint,
    });
  } catch {
    return rpc;
  }

  return rpc;
}
