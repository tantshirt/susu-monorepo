# Susu with Squads

## What this demonstrates

This example shows the Squads vault PDA controlled by a multisig acting as the Susu Group Creator. Member wallets approve a Squads vault transaction, and the vault transaction submits the Susu `createGroup` instruction with `creator` set to the vault PDA rather than to any individual member.

The local default path is a dry-run gateway that derives real Squads PDAs and exercises the proposal/approval/execute shape without requiring funded devnet wallets. Use it as the copy-paste integration skeleton, then replace the dry-run gateway with live Squads RPC calls when wiring production keys.

## Setup

```sh
cd examples/with-squads
pnpm install
cp .env.example .env
```

Environment variables:

| Name | Purpose |
| --- | --- |
| `HELIUS_RPC_URL` | Devnet RPC endpoint metadata used by the Susu client. Defaults to Solana public devnet. |
| `CLUSTER` | Susu cluster. Use `devnet` for the example. |
| `MULTISIG_PUBKEY` | Optional existing Squads multisig PDA. Leave blank to derive a new 2-of-3 demo multisig. |
| `SUSU_GROUP_ID` | Group id used for the Susu group PDA. |
| `PNPM_TEST_E2E` | Set to `1` to run the gated happy-path e2e test. |

## Run

```sh
pnpm start
pnpm test
PNPM_TEST_E2E=1 pnpm test
```

Expected output includes the Squads program id, multisig PDA, vault PDA, Susu group PDA, verified creator, and vault transaction signature. The verified creator should equal the vault PDA because Squads vault transactions sign inner instructions from the vault authority.

## Trade-offs of multisig governance

Latency: a multisig creator adds at least proposal plus threshold approval before execution, so group creation is slower than a single-key creator.

Recovery: threshold control gives teams a recovery path when one member loses a key, but the recovery story is only as strong as member key custody and operational discipline.

Censorship: a threshold can protect against one compromised or unavailable member, but it can also block group creation if enough members refuse to approve.

Threshold sizing: 2-of-3 is ergonomic for demos; higher-value mainnet groups should size thresholds around signer independence, geography, hardware wallets, and emergency runbooks.

Mainnet considerations: fund vault rent/fees, pin exact Squads and Susu program ids, rehearse proposal cancellation, and monitor proposal execution before inviting end users.

## See also

- [Squads integration guide](../../docs/integration-squads.md)
- [Susu TypeScript SDK](../../docs/sdk-typescript.md)
