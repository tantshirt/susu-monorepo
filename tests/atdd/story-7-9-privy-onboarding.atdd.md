# ATDD — Story 7.9: Privy email-onboarding integration + Wallet-Standard fallback

## Acceptance criteria (from issue #73, FR39, FR46)

- `PrivyProviderWrapper` configures `@privy-io/react-auth` with `loginMethods: ["email", "wallet"]`, embedded-wallet creation for users-without-wallets, and dark appearance.
- The Privy `solana.rpcs` config is sourced from `getRpcUrl()` in `apps/reference/lib/rpc/getRpcUrl.ts` (Story 7.16). No hardcoded Solana RPC URLs in the provider.
- A unified `useWallet()` hook in `apps/reference/lib/wallet/useWallet.ts` returns `{ connected, address, cluster, provider }` where `provider` is `"privy" | "wallet-standard" | null`. Privy is preferred when authenticated; otherwise Wallet-Standard is the fallback.
- `apps/reference/components/nav/WalletStatus.tsx` consumes `useWallet()`. When disconnected: renders a `Connect` button that triggers `usePrivy().login()`. When connected: renders a truncated address inside a `DropdownMenu` (shadcn) with a `Disconnect` action.
- The signing surface stays Wallet-Standard-primary per project memory: Privy is treated as a provider that surfaces an embedded wallet plus external Wallet-Standard wallets through `loginMethods: ["email", "wallet"]`. No `@solana/wallet-adapter-react` is added.
- Per NFR-R2, if Privy errors at runtime the app must not crash. The `useWallet` hook degrades gracefully by returning `provider: null` and `connected: false` instead of throwing.
- No directional Tailwind classes (`right-`, `left-`, `pl-`, `pr-`, `ml-`, `mr-`) — logical (`start-`, `end-`, `ps-`, `pe-`, `ms-`, `me-`) only.

## Static (red) assertions

The companion `story-7-9-privy-onboarding.static.red.test.mjs` enforces:

1. `apps/reference/app/providers/PrivyProviderWrapper.tsx` imports `PrivyProvider` from `@privy-io/react-auth`, references `loginMethods` containing both `"email"` and `"wallet"`, configures `embeddedWallets` with `createOnLogin: "users-without-wallets"`, sets `appearance.theme: "dark"`, and references `getRpcUrl` for Solana RPC config.
2. `apps/reference/lib/wallet/useWallet.ts` exists, declares `"use client"`, exports a `useWallet` hook, references `usePrivy` from `@privy-io/react-auth`, and exposes the `{ connected, address, cluster, provider }` shape (string match on each key).
3. `apps/reference/components/nav/WalletStatus.tsx` declares `"use client"`, imports `useWallet` from `@/lib/wallet/useWallet`, imports `usePrivy` from `@privy-io/react-auth`, and uses `DropdownMenu` from shadcn for the connected state.
4. No directional Tailwind classes appear in the three changed files.
