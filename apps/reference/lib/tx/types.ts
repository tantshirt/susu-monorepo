/**
 * Story 7.10 — reference-app tx types.
 *
 * Re-exports `SusuError` family from `@susu/sdk` (Story 6.3) so all
 * reference-app callers (`TransactionConfirmModal`, future contribute /
 * claim flows) import error types from a single in-app path. The SDK is
 * the source of truth; this module is a thin barrel.
 *
 * Also defines the `SimulationResult` shape consumed by
 * `TransactionConfirmModal` and `SimulationResultBlock`. The shape is
 * intentionally minimal — UI surfaces succeed/fail, optional logs, optional
 * compute-unit usage, and an optional structured error code/name lifted from
 * the SDK's `SusuError` / `SusuSimulationError`. Stories 7.14 / 7.15 will
 * produce these from `SusuClient.simulate(...)`.
 */

export {
  SusuClusterError,
  SusuError,
  SusuRpcError,
  SusuSimulationError,
  isSusuClusterError,
  isSusuError,
  isSusuProgramError,
  isSusuRpcError,
  isSusuSimulationError,
} from "@susu/sdk";

export type SusuTxError =
  | import("@susu/sdk").SusuError
  | import("@susu/sdk").SusuSimulationError
  | import("@susu/sdk").SusuRpcError
  | import("@susu/sdk").SusuClusterError
  | Error;

/**
 * Transaction signature — base58 string emitted by `submit(tx)`. We keep the
 * type as `string` rather than re-exporting `Signature` from `@solana/kit`
 * so the type stays runtime-light and serialisable.
 */
export type TxSignature = string;

/**
 * Simulation outcome surfaced inside the confirm modal.
 *
 * - `ok: true` → simulation completed without an `err`. `unitsConsumed` is
 *   reported when the RPC includes it; `logs` may be empty.
 * - `ok: false` → simulation reported an `err`. `errorCode` / `errorName` are
 *   populated when the SDK could resolve the program error.
 *
 * Warnings (e.g. compute-unit usage near the configured limit) are signalled
 * via `warnings: readonly string[]` so the modal can render `Banner`s
 * without re-implementing the heuristics in UI code.
 */
export interface SimulationResult {
  ok: boolean;
  unitsConsumed?: number;
  logs: readonly string[];
  errorCode?: number;
  errorName?: string;
  errorMessage?: string;
  warnings?: readonly string[];
}
