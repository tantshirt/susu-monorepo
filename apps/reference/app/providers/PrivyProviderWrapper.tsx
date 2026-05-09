"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
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
 * UI talks to RPCs. The Privy v2 `config.solana.rpcs` field expects
 * `@solana/kit` `Rpc` objects, which the reference app does not depend on
 * directly today; Story 7.10 will wire those kit RPC instances using the
 * URL produced here. Until then the URL is exposed via `data-rpc-url` on a
 * hidden span so it remains observable for tests and for Wallet-Standard
 * fallbacks that read from the document.
 */
export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  // Resolve once per mount. Helius → public-RPC fallback (Story 7.16, NFR-R1).
  // Cluster value is exposed alongside so downstream `solana`-aware code
  // (7.10/7.14/7.15) can pick the correct kit Rpc.
  const rpcUrl = getRpcUrl();
  const cluster = env.NEXT_PUBLIC_CLUSTER;
  const _solanaRpcConfig = { cluster, rpcUrl }; // Story 7.10 will consume.

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
          // Matches the Phantom-fintech dark skin (project_ux_design memory).
          theme: "dark",
        },
      }}
    >
      <span
        hidden
        aria-hidden="true"
        data-rpc-url={_solanaRpcConfig.rpcUrl}
        data-cluster={_solanaRpcConfig.cluster}
      />
      {children}
    </PrivyProvider>
  );
}
