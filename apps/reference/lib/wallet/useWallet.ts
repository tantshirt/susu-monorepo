"use client";

/**
 * Story 7.9 — unified `useWallet()` hook.
 *
 * Returns `{ connected, address, cluster, provider }` regardless of whether
 * the active wallet came from Privy email-onboarding (FR39) or a
 * Wallet-Standard browser-extension wallet (FR46). Privy is preferred when
 * authenticated; otherwise we fall back to the Wallet-Standard registry that
 * the browser exposes globally (no `@solana/wallet-adapter-react` dep —
 * Wallet-Standard is the primary surface per project memory).
 *
 * Per NFR-R2 the hook never throws — if Privy is unavailable (provider error,
 * SSR, or `NEXT_PUBLIC_PRIVY_APP_ID` not configured) we degrade to
 * `provider: null, connected: false` instead of crashing the tree.
 */

import * as React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { env } from "@/lib/env";
import type { WalletCluster, WalletProvider, WalletState } from "@/lib/wallet/types";

interface WalletStandardAccount {
  address?: string;
  publicKey?: { toString(): string } | string;
}

interface WalletStandardDisconnectFeature {
  disconnect(): void | Promise<void>;
}

interface WalletStandardWallet {
  chains?: readonly string[];
  accounts?: readonly WalletStandardAccount[];
  features?: {
    "standard:disconnect"?: WalletStandardDisconnectFeature;
  };
}

interface WalletStandardRegistry {
  get(): readonly WalletStandardWallet[];
}

interface NavigatorWithWallets extends Navigator {
  wallets?: WalletStandardRegistry;
}

let ignoredWalletStandardAddress: string | null = null;
const walletStandardListeners = new Set<() => void>();

function notifyWalletStandardListeners(): void {
  for (const listener of walletStandardListeners) {
    listener();
  }
}

/** Read the first Solana account exposed by any Wallet-Standard wallet. */
function readWalletStandardAccount(targetAddress?: string): {
  address: string;
  wallet: WalletStandardWallet;
} | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }
  try {
    const registry = (navigator as NavigatorWithWallets).wallets;
    const wallets = registry?.get?.() ?? [];
    for (const w of wallets) {
      const isSolana =
        !w.chains || w.chains.some((c) => typeof c === "string" && c.startsWith("solana:"));
      if (!isSolana) continue;
      const account = w.accounts?.[0];
      if (!account) continue;
      const address =
        typeof account.address === "string"
          ? account.address
          : typeof account.publicKey === "string"
            ? account.publicKey
            : account.publicKey?.toString();
      if (typeof address === "string" && address.length > 0) {
        if (!targetAddress || address === targetAddress) {
          return { address, wallet: w };
        }
      }
    }
  } catch {
    // Wallet-Standard is best-effort; never throw out of the hook.
    return null;
  }
  return null;
}

export function disconnectWalletStandardWallet(address: string): void {
  ignoredWalletStandardAddress = address;
  notifyWalletStandardListeners();

  try {
    const disconnectFeature =
      readWalletStandardAccount(address)?.wallet.features?.["standard:disconnect"];
    const result = disconnectFeature?.disconnect();
    void Promise.resolve(result).catch(() => {
      /* no-op — Wallet-Standard fallback is best-effort */
    });
  } catch {
    /* no-op — see NFR-R2 */
  }
}

/**
 * Read Privy state defensively — `usePrivy()` is called unconditionally
 * (rules-of-hooks) but the surrounding tree is wrapped in
 * `PrivyProviderWrapper` (the locked outermost provider), so the only
 * "Privy unavailable" case we still need to handle at this layer is Privy not
 * having finished booting (`ready === false`). That is represented in the
 * unified shape via `connected: false`, satisfying NFR-R2 without violating
 * rules-of-hooks.
 */

/**
 * Wallet-Standard fallback subscription. We use `useSyncExternalStore` so
 * (a) SSR returns `null` deterministically (server snapshot), (b) the
 * browser snapshot reads the registry synchronously per render without
 * triggering cascading effects.
 */
function useWalletStandardAddress(): string | null {
  const subscribe = React.useCallback((onChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    walletStandardListeners.add(onChange);
    // Wallet-Standard wallets register asynchronously (the extension content
    // script may inject after our first paint). A short polling subscription
    // keeps things simple without pulling in `@wallet-standard/app`.
    const id = window.setInterval(onChange, 1000);
    return () => {
      walletStandardListeners.delete(onChange);
      window.clearInterval(id);
    };
  }, []);
  const getSnapshot = React.useCallback((): string | null => {
    const address = readWalletStandardAccount()?.address ?? null;
    if (address && address === ignoredWalletStandardAddress) return null;
    return address;
  }, []);
  const getServerSnapshot = React.useCallback((): string | null => null, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Unified Solana wallet hook — Privy primary, Wallet-Standard fallback.
 */
export function useWallet(): WalletState {
  const cluster = env.NEXT_PUBLIC_CLUSTER as WalletCluster;
  const privy = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const walletStandardAddress = useWalletStandardAddress();

  if (!privy.ready) {
    return {
      connected: false,
      address: null,
      cluster,
      provider: null,
    };
  }

  // Prefer Privy when authenticated and a wallet is linked.
  if (privy.authenticated && privyWallets.length > 0) {
    const address = privyWallets[0]?.address ?? null;
    return {
      connected: !!address,
      address,
      cluster,
      provider: "privy" satisfies WalletProvider,
    };
  }

  // Otherwise try the Wallet-Standard registry.
  if (walletStandardAddress) {
    return {
      connected: true,
      address: walletStandardAddress,
      cluster,
      provider: "wallet-standard" satisfies WalletProvider,
    };
  }

  // Fully disconnected (covers the Privy-unavailable case per NFR-R2).
  return {
    connected: false,
    address: null,
    cluster,
    provider: null,
  };
}
