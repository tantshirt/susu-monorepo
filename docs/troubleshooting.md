# Troubleshooting

## RPC

Bucket: `rpc-reachability`

Message: "Helius/Solana devnet RPC unreachable."

Recovery: confirm `SUSU_DEMO_RPC_URL` or `HELIUS_RPC_URL` points to a reachable devnet-compatible endpoint. For local CI, start Surfpool and use `http://127.0.0.1:8899`. Public devnet RPC can throttle or reject traffic; use a dedicated Helius URL when demonstrating the 60-second path.

## Devnet Airdrop Limit

Bucket: `devnet-airdrop-limit`

Message: "Devnet airdrop rate limit. Run `solana airdrop 2` manually or wait 24h."

Recovery: retry with an already funded keypair via `SUSU_DEMO_KEYPAIR_PATH`, run `solana airdrop 2 <pubkey> --url <rpc>` manually, or point `SUSU_DEMO_RPC_URL` at a Surfpool fork where local airdrops are deterministic. For a full walkthrough (including `SUSU_DEMO_SKIP_PREFLIGHT` and CI parity), see [`docs/demo-setup.md`](./demo-setup.md).

## Dependency Mismatch

Bucket: `dependency-mismatch`

Message: "Toolchain mismatch. Run `nvm use && rustup show`."

Recovery: install the versions implied by `.nvmrc`, `packageManager`, `rust-toolchain.toml`, Anchor, and the Solana CLI. Then run `pnpm install`, `pnpm --filter @susu/sdk build`, and `pnpm susu:demo` again.

## Performance Budget

Bucket: `performance-budget`

Message: "Demo exceeded NFR-P2 budget: Xs > 60s."

Recovery: run the demo against a local Surfpool fork first to separate RPC latency from SDK/runtime work. If the forked run is still over budget, profile the phase timings printed by `pnpm susu:demo` and keep the public path under `SUSU_DEMO_MAX_SECONDS`.

## Verify Budget

Bucket: `verify-budget`

Message: "verify exceeded NFR-Re4 budget: Xs > 600s."

Recovery: inspect the `pnpm verify` summary table and rerun the slow step directly. The clean-clone path should stay under ten minutes on a 4-core developer laptop with a stable devnet-compatible RPC.

## Mainnet Immutability

Bucket: `immutability`

Message: "program is still upgradeable."

Recovery: this check only enforces on `CLUSTER=mainnet-beta`. Before a mainnet release, burn the upgrade authority through the approved deploy procedure, then rerun `CLUSTER=mainnet-beta bash scripts/check-immutability.sh`.
