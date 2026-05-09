/**
 * Story 7.16 — Public surface for the reference app's RPC layer.
 *
 * `getRpcUrl()` owns the Helius → public-fallback selection. The real RPC
 * client (with retry, exponential backoff, banner-driven degraded-state
 * surfacing) lands in stories 7.10 / 7.14 alongside transaction code; until
 * then `createRpcClient()` is a typed placeholder so callers can wire the
 * import path without depending on the implementation timing.
 */

import { getRpcUrl } from "./getRpcUrl";

export { getRpcUrl };

export interface RpcClient {
  /** The currently selected RPC URL (Helius or public fallback). */
  url: string;
}

/**
 * Placeholder factory for the eventual `@solana/kit` / `@solana/client` RPC
 * client. Returning a typed shape today lets the call sites in 7.10/7.14
 * land alongside their real implementation without breaking imports here.
 */
export function createRpcClient(): RpcClient {
  return { url: getRpcUrl() };
}
