/**
 * Story 7.15 — Claim Payout flow closure builders.
 *
 * Surface required by `<TransactionConfirmModal />` (Story 7.10):
 *   - `buildTx() => Promise<unknown>`
 *   - `simulate(tx) => Promise<SimulationResult>`
 *   - `submit(tx) => Promise<TxSignature>`
 *
 * The reference app composes these on top of `@susu/sdk`'s `SusuClient` so
 * the SDK stays the single source of truth for instruction encoding,
 * simulate-by-default policy (Story 6.2), and program-error mapping (Story
 * 6.3). RPC URL routing is centralised through `getRpcUrl()` (Story 7.16).
 *
 * Notes on scope:
 *   - This module ships the orchestration shape so the modal can wire to a
 *     real signer in a follow-up Privy-binding pass. Until the signer is
 *     bound, `submitClaim()` throws a structured `SusuError` so the modal
 *     can render a clean failure banner rather than crashing. This is the
 *     same caveat as Story 7.14's `lib/susu/contribute.ts`; both modules
 *     swap to typed call sites once the Privy signer plugin lands.
 *   - We intentionally do NOT import the @susu/sdk helper `claimPayout()`
 *     directly — that helper is build+simulate+submit-in-one and would
 *     bypass the modal's per-phase UX (UX-DR42). Instead we hold a typed
 *     reference to `SusuClient` and split the work across the three
 *     closures.
 */

import { createSolanaRpc } from '@solana/kit';
import {
  createSusuClient,
  SusuError,
  SusuClient,
  type SusuSimulationResponse,
} from '@susu/sdk';
import { getRpcUrl } from '@/lib/rpc/getRpcUrl';
import type { SimulationResult, TxSignature } from '@/lib/tx/types';

/**
 * Inputs the Claim flow needs to mint a transaction. Mirrors the
 * `claimPayout({ group, rotationIndex, ... })` shape from
 * `sdk/ts/src/helpers/claimPayout.ts`.
 */
export interface ClaimParams {
  groupPda: string;
  /** Recipient PDA for this rotation (member-position holder). */
  recipient: string;
  /** Member-position PDA for the recipient in this group. */
  memberPosition: string;
  /** Member account / wallet pubkey of the recipient. */
  member: string;
  /** Vault PDA the payout is drawn from. */
  vault: string;
  /** RotationReceipt PDA for this rotation — created by claimPayout. */
  receipt: string;
  /** Zero-based rotation slot being claimed. */
  rotationIndex: number;
  /** Group identifier emitted by the on-chain create-group instruction. */
  groupId: string;
  /** SPL Token / Token-2022 program id appropriate for the mint. */
  tokenProgram: string;
  /** Cluster the claim targets — defaulted at the call site. */
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
}

/**
 * Stable opaque handle returned by `buildClaimTx`. We carry the resolved
 * client + params through the modal phases without leaking SDK types into
 * the UI layer.
 */
export interface ClaimTxHandle {
  readonly kind: 'susu.claim';
  readonly client: SusuClient;
  readonly params: ClaimParams;
  /** Lazily-populated simulation snapshot used by `submitClaim`. */
  simulation: SusuSimulationResponse | null;
}

function rpcClient() {
  return createSolanaRpc(getRpcUrl());
}

function susuClient(cluster: ClaimParams['cluster']): SusuClient {
  // The reference app's SusuClient is configured per-call so each modal
  // session picks up the freshest RPC URL (the Helius / public fallback
  // can flip at runtime, NFR-R1).
  return createSusuClient({ cluster: cluster ?? 'devnet' });
}

/**
 * Build a SusuClient-backed transaction handle for the `claimPayout`
 * instruction. The actual transaction object is owned by the SDK; we hand
 * back a typed handle that the simulate/submit closures consume.
 *
 * Note: a green-phase upgrade will swap this for the SDK's
 * `prepareClaimPayout(...)` once the Privy signer plugin lands; the
 * `unknown` return type on the modal contract means we can evolve the
 * inner shape without leaking through to the UI.
 */
export async function buildClaimTx(params: ClaimParams): Promise<ClaimTxHandle> {
  // Touch the RPC URL early — this surfaces the public-RPC-fallback warning
  // (`getRpcUrl()` warns once in dev) at modal-open time rather than on
  // submit, matching UX-DR22 (degraded-state visibility before commit).
  rpcClient();
  const client = susuClient(params.cluster);
  return {
    kind: 'susu.claim',
    client,
    params,
    simulation: null,
  };
}

/**
 * Simulate the claim transaction. Maps the SDK's
 * `SusuSimulationResponse` shape to the reference-app-friendly
 * `SimulationResult` type consumed by `<TransactionConfirmModal />`.
 */
export async function simulateClaim(handle: ClaimTxHandle): Promise<SimulationResult> {
  if (!handle || handle.kind !== 'susu.claim') {
    return {
      ok: false,
      logs: [],
      errorName: 'SusuError',
      errorMessage: 'Invalid claim handle — rebuild the transaction.',
    };
  }
  // The Privy-bound `SusuClient` exposes `.simulateClaimPayout(...)` once
  // the signer plugin is registered. Until that wiring lands we degrade to
  // a stub simulation that surfaces the reason via the modal banner — this
  // keeps the simulate-before-submit gate honest (UX-DR42) without
  // crashing the tree.
  const simulator = (handle.client as unknown as {
    simulateClaimPayout?: (params: ClaimParams) => Promise<SusuSimulationResponse>;
  }).simulateClaimPayout;
  if (typeof simulator !== 'function') {
    return {
      ok: false,
      logs: [],
      errorName: 'SusuSignerNotBound',
      errorMessage:
        'Wallet signer is not yet bound to the SusuClient. Connect a Privy or Wallet-Standard wallet and retry.',
    };
  }
  try {
    const sim = await simulator(handle.params);
    handle.simulation = sim;
    const err = sim.err ?? sim.error ?? sim.value?.err;
    const ok = !err;
    const logs = sim.logs ?? sim.programLogs ?? sim.value?.logs ?? sim.value?.programLogs ?? [];
    return {
      ok,
      logs,
      errorName: ok ? undefined : 'SusuSimulationError',
      errorMessage: ok
        ? undefined
        : typeof err === 'string'
          ? err
          : 'Simulation reported an error.',
    };
  } catch (err) {
    if (err instanceof SusuError) {
      return {
        ok: false,
        logs: [],
        errorName: err.name,
        errorMessage: err.message,
      };
    }
    return {
      ok: false,
      logs: [],
      errorName: 'Error',
      errorMessage: err instanceof Error ? err.message : 'Unknown simulation error.',
    };
  }
}

/**
 * Submit a previously-simulated claim transaction. Throws a structured
 * `SusuError` if the wallet signer is not yet bound — the modal renders the
 * error in a `Banner` and keeps the user on the page (UX-DR42).
 */
export async function submitClaim(handle: ClaimTxHandle): Promise<TxSignature> {
  if (!handle || handle.kind !== 'susu.claim') {
    throw new SusuError({ kind: 'cluster', message: 'Invalid claim handle.' } as never);
  }
  if (!handle.simulation || handle.simulation.err) {
    throw new SusuError({
      kind: 'simulation',
      message: 'Refusing to submit — simulation has not succeeded for this handle.',
    } as never);
  }
  const submitter = (handle.client as unknown as {
    submitClaimPayout?: (params: ClaimParams) => Promise<TxSignature>;
  }).submitClaimPayout;
  if (typeof submitter !== 'function') {
    throw new SusuError({
      kind: 'cluster',
      message:
        'Wallet signer is not yet bound to the SusuClient. Connect a wallet and retry — your simulation result is preserved.',
    } as never);
  }
  return submitter(handle.params);
}
