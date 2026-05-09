/**
 * Story 7.16 — Helius RPC fallback to public.
 *
 * Returns the RPC URL the reference app should use:
 *   1. `NEXT_PUBLIC_HELIUS_RPC_URL` when set to a non-empty valid URL.
 *   2. Otherwise the cluster-appropriate public Solana RPC URL.
 *
 * Architecture references: NFR-R1 (Helius default with public fallback),
 * architecture.md §"SDK reads: 1 retry on RPC error; fall back to public RPC
 * if Helius fails". The actual retry/backoff layer lands in 7.10/7.14
 * alongside the real client; this module only owns URL selection.
 *
 * Server-safe AND client-safe — no `window` references — so it can run in
 * Server Components, Route Handlers, and the browser bundle.
 */

import { IS_DEV, env } from "@/lib/env";

/**
 * The only place in the reference app permitted to hardcode RPC URLs. Every
 * other module routes through `getRpcUrl()` so the fallback chain stays
 * centralised and audit-friendly.
 */
const PUBLIC_FALLBACK_BY_CLUSTER: Record<typeof env.NEXT_PUBLIC_CLUSTER, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://localhost:8899",
};

let warnedOnce = false;

function isNonEmptyValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  try {
    // `URL` is available in both Node and the browser at runtime.
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the RPC URL for the current cluster. Prefers Helius when
 * `NEXT_PUBLIC_HELIUS_RPC_URL` is a non-empty valid URL; otherwise returns
 * the cluster's public RPC URL and emits a one-time `console.warn` in dev
 * mode so the fallback is visible during local development.
 */
export function getRpcUrl(): string {
  const helius = env.NEXT_PUBLIC_HELIUS_RPC_URL;
  if (isNonEmptyValidUrl(helius)) {
    return helius;
  }

  const fallback = PUBLIC_FALLBACK_BY_CLUSTER[env.NEXT_PUBLIC_CLUSTER];

  if (!warnedOnce && IS_DEV) {
    warnedOnce = true;
    // eslint-disable-next-line no-console
    console.warn(
      `[susu] NEXT_PUBLIC_HELIUS_RPC_URL is missing or invalid; falling back to public RPC ${fallback} for cluster ${env.NEXT_PUBLIC_CLUSTER}.`,
    );
  }

  return fallback;
}
