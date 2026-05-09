/**
 * Story 7.9 — unified wallet types.
 *
 * The reference app exposes a single `useWallet()` hook regardless of whether
 * the user signed in via Privy email-onboarding (FR39) or via a Wallet-Standard
 * browser-extension wallet (FR46). Downstream UI (`WalletStatus`, signing UX
 * in 7.10/7.14/7.15) consumes only this shape.
 */

export type WalletCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

/** Which provider currently backs the active wallet, or `null` when none. */
export type WalletProvider = "privy" | "wallet-standard" | null;

export interface WalletState {
  /** True when an authenticated wallet is available for signing. */
  connected: boolean;
  /** Base58 Solana address of the active wallet, or `null`. */
  address: string | null;
  /** The cluster the app is currently configured against (from env). */
  cluster: WalletCluster;
  /** Which provider supplied the active wallet. */
  provider: WalletProvider;
}
