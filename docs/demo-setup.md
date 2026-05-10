# Susu demo setup

This guide explains how to run `pnpm susu:demo`, the reference app (`apps/reference`), and how to recover from common failures such as **`devnet-airdrop-limit`**.

## What `pnpm susu:demo` does

1. **Phase 0 — Preflight** (unless skipped): checks Node, pnpm, Anchor CLI, Solana CLI, RPC health, then ensures a payer keypair exists and requests devnet SOL via `solana airdrop` if the balance is low.
2. **Phase 1 — Mock member keypairs**: creates or reuses five member keypairs under `.susu-demo/keypairs/` and airdrops **0.1 SOL** each if needed.
3. **Phase 2 — SDK build** and **Node runner** (`scripts/susu-demo.mjs`): runs a **mock ROSCA cycle** with simulated transactions (the JS runner does **not** submit real on-chain transactions).

So a faucet failure in Phase 0/1 blocks the script **before** the mock demo runs. Funding is only required for **Solana CLI preflight**, not for the mock SDK loop itself.

## Prerequisites (full preflight path)

- Node.js and pnpm (see repo `.nvmrc` and `packageManager` in root `package.json`)
- Anchor CLI and Solana CLI with `solana-keygen`
- A reachable **devnet-compatible** RPC URL

## Environment variables (demo script)

| Variable | Purpose |
|----------|---------|
| `SUSU_DEMO_RPC_URL` | RPC used for health checks and `solana airdrop` (overrides `HELIUS_RPC_URL` / `NEXT_PUBLIC_HELIUS_RPC_URL` fallbacks) |
| `SUSU_DEMO_CLUSTER` | Cluster label for the Node runner (default `devnet`) |
| `SUSU_DEMO_KEYPAIR_PATH` | Payer keypair path (default `.susu-demo/payer.json`) |
| `SUSU_DEMO_KEYPAIR_DIR` | Member keypair directory (default `.susu-demo/keypairs`) |
| `SUSU_DEMO_SKIP_AIRDROP` | Set to `1` to skip faucet calls (wallet must already be funded) |
| `SUSU_DEMO_SKIP_PREFLIGHT` | Set to `1` to skip Anchor/Solana/RPC/airdrop checks entirely (used in some CI verify paths) |
| `SUSU_DEMO_MAX_SECONDS` | Wall-clock budget for the script (default `60`) |

## Recovery: `devnet-airdrop-limit`

Public devnet faucets rate-limit. The script may fail after several `airdrop` calls.

**Options:**

1. **Wait and retry**, or run a manual airdrop:
   ```bash
   solana airdrop 2 <PAYER_PUBKEY> --url <your-devnet-rpc>
   ```
2. **Use an already-funded payer** (and optionally skip further airdrops):
   ```bash
   SUSU_DEMO_KEYPAIR_PATH=/path/to/funded-devnet.json pnpm susu:demo
   ```
   If members still need SOL, pre-fund keys under `.susu-demo/keypairs/` or set `SUSU_DEMO_SKIP_AIRDROP=1` after funding.
3. **Use a dedicated RPC** (e.g. provider devnet) — often less throttled than the public endpoint:
   ```bash
   SUSU_DEMO_RPC_URL=https://your-devnet-rpc.example.com pnpm susu:demo
   ```
4. **Match CI: local Surfpool fork** on port 8899 (see `.github/workflows/ci.yml` `susu-demo-smoke` job):
   - Start Surfpool with devnet network and port `8899`
   - Run:
     ```bash
     SUSU_DEMO_RPC_URL=http://127.0.0.1:8899 SUSU_DEMO_KEYPAIR_PATH=.susu-demo/ci-payer.json SUSU_DEMO_KEYPAIR_DIR=.susu-demo/ci-keypairs pnpm susu:demo
     ```
   Adjust paths to match your local setup.
5. **Skip preflight** (no faucet, fastest for verifying the mock runner only):
   ```bash
   SUSU_DEMO_SKIP_PREFLIGHT=1 pnpm susu:demo
   ```

More bucket descriptions: [troubleshooting.md](./troubleshooting.md).

## Reference app (`apps/reference`)

The member UI is a separate process from `pnpm susu:demo`.

1. Install dependencies at repo root:
   ```bash
   pnpm install
   ```
2. Copy env template:
   ```bash
   cp apps/reference/.env.example apps/reference/.env.local
   ```
3. Fill **real** values in `apps/reference/.env.local`:
   - `NEXT_PUBLIC_HELIUS_RPC_URL` — devnet RPC URL (dedicated URL recommended)
   - `NEXT_PUBLIC_PRIVY_APP_ID` — from [Privy dashboard](https://dashboard.privy.io)
   - `NEXT_PUBLIC_CONVEX_URL` — from [Convex dashboard](https://dashboard.convex.dev)
   - `NEXT_PUBLIC_PROGRAM_ID` — deployed Susu program id (base58)
   - `NEXT_PUBLIC_CLUSTER` — `devnet` (or `localnet` / `mainnet-beta` when appropriate)
4. Run the app:
   ```bash
   pnpm --filter @susu/reference dev
   ```
5. Open `http://localhost:3000` (middleware redirects to a locale prefix, e.g. `/en`).

## Epic 9 (mainnet) vs demo

**Do not** conflate devnet demo funding with mainnet deploy. Mainnet work is gated behind audit signoff and immutability checks. See [epic9-mainnet-gate.md](./epic9-mainnet-gate.md).
