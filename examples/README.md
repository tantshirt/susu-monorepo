# `examples/`

End-to-end integration examples that show how to wire `@susu/sdk` into common Solana ecosystem tools. Each example is a standalone TypeScript project with its own `package.json` and `README.md`.

| Example | Path | What it demonstrates |
| --- | --- | --- |
| Privy | [`./with-privy/`](./with-privy/) | Email-based onboarding with embedded wallets via Privy + Susu group lifecycle. Wallet-Standard remains primary; Privy is a provider. |
| Squads | [`./with-squads/`](./with-squads/) | Treasury management — using a Squads multisig as the Susu group creator/recipient. |
| Token-2022 (Token Extensions) | [`./with-token-extensions/`](./with-token-extensions/) | Using Token-2022 mints with transfer hooks / interest-bearing extensions inside a Susu group. |

## Run

```bash
pnpm install                           # from repo root
cd examples/with-privy
pnpm dev                               # follow the per-example README
```

Each example targets devnet by default. See [`/docs/demo-setup.md`](../docs/demo-setup.md) for cluster config and airdrop recovery.

## Adding a new example

1. Create `examples/<your-example>/` with `package.json`, `README.md`, and a runnable script.
2. Depend on `@susu/sdk` via the workspace protocol (`"@susu/sdk": "workspace:*"`).
3. Add a top-level row to this table.
4. CI's link checker will verify the README link from the [link cluster in the root README](../README.md#verify-every-claim).
