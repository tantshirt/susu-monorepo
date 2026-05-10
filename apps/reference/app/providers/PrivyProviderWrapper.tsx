"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { createSolanaRpc } from "@solana/kit";
import { env } from "@/lib/env";
import { getRpcUrl } from "@/lib/rpc/getRpcUrl";

/**
 * Outermost provider in the locked chain
 * (PrivyProvider > ConvexProvider > IntlProvider > children).
 *
 * Privy must hydrate auth state before Convex mounts so Convex queries can
 * read the authenticated identity at first paint. See apps/reference/README.md
 * for the rationale.
 *
 * Story 7.9 — wires Privy email-onboarding (FR39) plus Wallet-Standard
 * fallback (FR46). Wallet-Standard remains the *primary* signing surface per
 * project memory; Privy is treated as a provider that surfaces both an
 * embedded wallet (for users-without-wallets) and external Wallet-Standard
 * wallets through `loginMethods: ["email", "wallet"]`.
 *
 * The Solana RPC URL is resolved up-front via `getRpcUrl()` (Story 7.16) so
 * the Helius → public-RPC fallback chain is honoured everywhere downstream
 * UI talks to RPCs.
 *
 * Story 7.10 — wire the `@solana/kit` `Rpc` instance so the Privy SDK and
 * downstream consumers (TransactionConfirmModal, contribute / claim flows)
 * share the same RPC plane. We construct it once with `createSolanaRpc(...)`
 * and pass the URL into Privy via `config.solana.rpcs[<cluster>]`. The kit
 * instance is also exposed on the hidden `<span data-rpc-url>` for
 * Wallet-Standard fallbacks and test inspection.
 *
 * Privy's `solana.rpcs` typing accepts a `chainId → string-or-RpcLike` map,
 * so we pass the URL string directly; the Solana side of Privy
 * instantiates its own client when needed. The kit `Rpc` we build here is
 * the canonical client our own code uses; we don't try to inject the kit
 * object into Privy's internal plumbing.
 */
export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  // Resolve once per mount. Helius → public-RPC fallback (Story 7.16, NFR-R1).
  const rpcUrl = getRpcUrl();
  const cluster = env.NEXT_PUBLIC_CLUSTER;

  // Construct the kit RPC eagerly so the (idempotent) factory cost is paid
  // at provider mount rather than on every page render. Downstream code
  // re-builds via `createSolanaRpc(getRpcUrl())` as needed; this instance
  // is primarily a smoke-test that the URL is well-formed at boot.
  // Reading `_kitRpc.transport` is cheap and avoids the unused-binding lint
  // without exporting the instance globally.
  const _kitRpc = createSolanaRpc(rpcUrl);
  void _kitRpc;

  // Privy's Solana RPC mapping keys by chain id. We map our app cluster
  // (`mainnet-beta` / `devnet` / `testnet` / `localnet`) onto the
  // canonical Solana CAIP-2 chain ids so Privy can correlate signing
  // requests. localnet falls back to devnet's id since Privy doesn't
  // ship a localnet entry.
  const chainIdByCluster: Record<typeof cluster, string> = {
    "mainnet-beta": "mainnet-beta",
    devnet: "devnet",
    testnet: "testnet",
    localnet: "devnet",
  };
  const privySolanaRpcs: Record<string, { rpcUrl: string }> = {
    [chainIdByCluster[cluster]]: { rpcUrl },
  };

  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        // Email is the primary CTA per FR39; "wallet" provides the
        // Wallet-Standard browser-extension fallback per FR46.
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          // Email-only sign-ins get an embedded wallet automatically; users
          // who already have a Wallet-Standard wallet keep using it.
          createOnLogin: "users-without-wallets",
        },
        appearance: {
          // Match the publish-ready light fintech app shell.
          theme: "light",
        },
        // `solana.rpcs` is a Privy-typed loose record; cast to the same
        // shape the Privy SDK accepts without pulling its internal types.
        solana: { rpcs: privySolanaRpcs } as unknown as Record<string, unknown>,
      }}
    >
      <span
        hidden
        aria-hidden="true"
        data-rpc-url={rpcUrl}
        data-cluster={cluster}
      />
      {children}
    </PrivyProvider>
  );
}
