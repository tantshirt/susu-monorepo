import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { env } from "@/lib/env";
import { getRpcUrl } from "@/lib/rpc/getRpcUrl";
import type { WalletCluster } from "@/lib/wallet/types";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";

const CREATE_GROUP_DISCRIMINATOR = Uint8Array.from([79, 60, 158, 134, 61, 199, 56, 248]);
const GROUP_SEED = new TextEncoder().encode("group");
const VAULT_SEED = new TextEncoder().encode("vault");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDT_DEVNET = "EiXDnrAg9ea2Q6vEPV7E5TpTU1vh41jcuZqKjU5Dc4ZF";
const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MAINNET = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export type CreateGroupMintOption = Readonly<{
  symbol: "USDC" | "USDT";
  mint: string;
}>;

export interface CreateGroupParams {
  creator: string;
  groupId: bigint;
  n: number;
  contributionAmount: bigint;
  contributionPeriod: bigint;
  mint: string;
  cluster: WalletCluster;
}

export interface CreateGroupTxHandle {
  readonly kind: "susu.createGroup";
  readonly cluster: WalletCluster;
  readonly connection: Connection;
  readonly transaction: Transaction;
  readonly creator: string;
  readonly groupPda: string;
  readonly vaultPda: string;
  readonly groupId: bigint;
  readonly n: number;
  readonly contributionAmount: bigint;
  readonly contributionPeriod: bigint;
  readonly mint: string;
  simulation: SimulationResult | null;
}

export type PrivySolanaSender = (input: {
  transaction: Transaction;
  connection: Connection;
  address?: string;
  uiOptions?: {
    title?: string;
    description?: string;
    buttonText?: string;
  };
}) => Promise<{ signature: string }>;

export type StandardSolanaSender<TWallet> = (input: {
  transaction: Uint8Array;
  wallet: TWallet;
  chain?: "solana:mainnet" | "solana:devnet" | "solana:testnet";
  options?: {
    minContextSlot?: number;
    uiOptions?: {
      title?: string;
      description?: string;
    };
  };
}) => Promise<{ signature: Uint8Array }>;

export function supportedCreateGroupMints(cluster: WalletCluster): readonly CreateGroupMintOption[] {
  if (cluster === "mainnet-beta") {
    return [
      { symbol: "USDC", mint: USDC_MAINNET },
      { symbol: "USDT", mint: USDT_MAINNET },
    ];
  }
  return [
    { symbol: "USDC", mint: USDC_DEVNET },
    { symbol: "USDT", mint: USDT_DEVNET },
  ];
}

export function defaultCreateGroupMint(cluster: WalletCluster): string {
  return supportedCreateGroupMints(cluster)[0]?.mint ?? USDC_DEVNET;
}

export function generateGroupId(): bigint {
  const time = BigInt(Date.now());
  const random = BigInt(globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? 0);
  return (time << BigInt(20)) + (random & BigInt(0xfffff));
}

export async function buildCreateGroupTx(params: CreateGroupParams): Promise<CreateGroupTxHandle> {
  validateCreateGroupParams(params);

  const connection = new Connection(getRpcUrl(), "confirmed");
  const programId = new PublicKey(env.NEXT_PUBLIC_PROGRAM_ID);
  const creator = new PublicKey(params.creator);
  const mint = new PublicKey(params.mint);
  const groupIdBytes = encodeU64(params.groupId);
  const [groupPda] = PublicKey.findProgramAddressSync(
    [GROUP_SEED, creator.toBuffer(), groupIdBytes],
    programId,
  );
  const [vaultPda] = PublicKey.findProgramAddressSync([VAULT_SEED, groupPda.toBuffer()], programId);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({ feePayer: creator, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: groupPda, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(encodeCreateGroupData(params)),
    }),
  );

  return {
    kind: "susu.createGroup",
    cluster: params.cluster,
    connection,
    transaction,
    creator: params.creator,
    groupPda: groupPda.toBase58(),
    vaultPda: vaultPda.toBase58(),
    groupId: params.groupId,
    n: params.n,
    contributionAmount: params.contributionAmount,
    contributionPeriod: params.contributionPeriod,
    mint: params.mint,
    simulation: null,
  };
}

export async function simulateCreateGroup(handle: CreateGroupTxHandle): Promise<SimulationResult> {
  if (!handle || handle.kind !== "susu.createGroup") {
    return {
      ok: false,
      logs: [],
      errorName: "SusuError",
      errorMessage: "Invalid create-group handle — rebuild the transaction.",
    };
  }

  try {
    const response = await handle.connection.simulateTransaction(handle.transaction);
    const logs = response.value.logs ?? [];
    const ok = !response.value.err;
    const result: SimulationResult = {
      ok,
      logs,
      unitsConsumed: response.value.unitsConsumed ?? undefined,
      errorName: ok ? undefined : "SusuSimulationError",
      errorMessage: ok ? undefined : JSON.stringify(response.value.err),
    };
    handle.simulation = result;
    return result;
  } catch (error) {
    const result = {
      ok: false,
      logs: [],
      errorName: "SusuRpcError",
      errorMessage: error instanceof Error ? error.message : "Unknown simulation error.",
    };
    handle.simulation = result;
    return result;
  }
}

export async function submitCreateGroupWithPrivy(
  handle: CreateGroupTxHandle,
  sendTransaction: PrivySolanaSender,
): Promise<TxSignature> {
  assertReadyToSubmit(handle);
  const receipt = await sendTransaction({
    transaction: handle.transaction,
    connection: handle.connection,
    address: handle.creator,
    uiOptions: {
      title: "Create Susu circle",
      description: `Create a ${handle.n}-member savings circle on ${handle.cluster}.`,
      buttonText: "Create circle",
    },
  });
  return receipt.signature as TxSignature;
}

export async function submitCreateGroupWithStandard<TWallet>(
  handle: CreateGroupTxHandle,
  wallet: TWallet,
  signAndSendTransaction: StandardSolanaSender<TWallet>,
): Promise<TxSignature> {
  assertReadyToSubmit(handle);
  const response = await signAndSendTransaction({
    transaction: handle.transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }),
    wallet,
    chain: solanaChain(handle.cluster),
    options: {
      uiOptions: {
        title: "Create Susu circle",
        description: `Create a ${handle.n}-member savings circle on ${handle.cluster}.`,
      },
    },
  });
  return encodeBase58(response.signature) as TxSignature;
}

function validateCreateGroupParams(params: CreateGroupParams): void {
  new PublicKey(params.creator);
  new PublicKey(params.mint);
  new PublicKey(env.NEXT_PUBLIC_PROGRAM_ID);
  if (params.n < 3 || params.n > 12 || !Number.isInteger(params.n)) {
    throw new Error("Group size must be a whole number between 3 and 12.");
  }
  if (params.contributionAmount <= BigInt(0)) {
    throw new Error("Contribution amount must be greater than zero.");
  }
  if (params.contributionPeriod <= BigInt(0)) {
    throw new Error("Contribution period must be greater than zero.");
  }
  if (params.groupId < BigInt(0)) {
    throw new Error("Group id must be positive.");
  }
}

function assertReadyToSubmit(handle: CreateGroupTxHandle): void {
  if (!handle.simulation?.ok) {
    throw new Error("Refusing to submit — simulation has not succeeded for this transaction.");
  }
}

function encodeCreateGroupData(params: CreateGroupParams): Uint8Array {
  const mint = new PublicKey(params.mint);
  return concatBytes(
    CREATE_GROUP_DISCRIMINATOR,
    encodeU64(params.groupId),
    Uint8Array.from([params.n]),
    encodeU64(params.contributionAmount),
    encodeI64(params.contributionPeriod),
    mint.toBytes(),
    // CurveParams is currently an empty Anchor struct, so it serializes to no bytes.
    new Uint8Array(),
  );
}

function encodeU64(value: bigint): Uint8Array {
  if (value < BigInt(0) || value > BigInt("18446744073709551615")) {
    throw new Error("u64 value out of range.");
  }
  return encodeBigIntLe(value);
}

function encodeI64(value: bigint): Uint8Array {
  if (value < BigInt("-9223372036854775808") || value > BigInt("9223372036854775807")) {
    throw new Error("i64 value out of range.");
  }
  return encodeBigIntLe(value < BigInt(0) ? BigInt("18446744073709551616") + value : value);
}

function encodeBigIntLe(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  let remaining = value;
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }
  return bytes;
}

function concatBytes(...chunks: readonly Uint8Array[]): Uint8Array {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function solanaChain(cluster: WalletCluster): "solana:mainnet" | "solana:devnet" | "solana:testnet" {
  if (cluster === "mainnet-beta") return "solana:mainnet";
  if (cluster === "testnet") return "solana:testnet";
  return "solana:devnet";
}

function encodeBase58(bytes: Uint8Array): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] * 256;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    digits.push(0);
  }
  return digits
    .reverse()
    .map((digit) => alphabet[digit])
    .join("");
}
