# Troubleshooting

## RPC

Bucket: `rpc-reachability`

Message: "Helius/Solana devnet RPC unreachable."

Recovery: confirm `SUSU_DEMO_RPC_URL` or `HELIUS_RPC_URL` points to a reachable devnet-compatible endpoint. For local CI, start Surfpool and use `http://127.0.0.1:8899`. Public devnet RPC can throttle or reject traffic; use a dedicated Helius URL when demonstrating the 60-second path.

## Devnet Airdrop Limit

Bucket: `devnet-airdrop-limit`

Message: "Devnet airdrop rate limit. Run `solana airdrop 2` manually or wait 24h."

Recovery: retry with an already funded keypair via `SUSU_DEMO_KEYPAIR_PATH`, run `solana airdrop 2 <pubkey> --url <rpc>` manually, or point `SUSU_DEMO_RPC_URL` at a Surfpool fork where local airdrops are deterministic.

## Dependency Mismatch

Bucket: `dependency-mismatch`

Message: "Toolchain mismatch. Run `nvm use && rustup show`."

Recovery: install the versions implied by `.nvmrc`, `packageManager`, `rust-toolchain.toml`, Anchor, and the Solana CLI. Then run `pnpm install`, `pnpm --filter @susu/sdk build`, and `pnpm susu:demo` again.
