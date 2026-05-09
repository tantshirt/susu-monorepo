# Susu With Privy

## What this demonstrates

This example provisions three Solana wallets with Privy, adapts each wallet to the `@solana/kit` `TransactionSigner` shape, and runs the Susu SDK happy path: create a group, accept invites, post collateral, and contribute.

## Setup

Use Node 20 LTS or newer and pnpm 9. Copy `.env.example` to `.env`, then fill in `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `HELIUS_RPC_URL`, and `CLUSTER=devnet`. The demo creates devnet-only mock members; fund the generated wallet addresses before replacing the mocked RPC bridge with a live transaction broadcaster.

```sh
pnpm install
```

## Run

```sh
pnpm start
```

The script prints each Privy wallet address, the Susu helper step, and the returned transaction signature.

## Trade-offs

Privy embedded wallets remove seed-phrase setup from the user journey, but forks still need to design recovery, authorization-key storage, rate-limit handling, and mainnet transaction review. Keep Privy credentials server-side, keep `CLUSTER=devnet` while testing, and only move to mainnet after wiring a real transaction compiler/broadcaster behind the SDK RPC interface.

## See also

- [Privy integration guide](../../docs/integration-privy.md)
- [Susu TypeScript SDK](../../docs/sdk-typescript.md)
