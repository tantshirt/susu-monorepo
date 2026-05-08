# Codama Rust Renderer Status (Story 1.6 Finalization)

- Story: `1.6-daily-log-day1-spikes`
- Date: `2026-05-07`
- Status: `fallback`

## Spike Result

This environment cannot run the Story 1.6 Codama compile gate because required tools are unavailable.

Commands executed in this worktree:

- `pnpm sdk:codegen` -> failed (`pnpm: command not found`, exit 127)
- `cargo build -p susu-client` -> failed (`cargo: command not found`, exit 127)
- `anchor --version` -> failed (`anchor: command not found`, exit 127)
- `node codama.config.mjs` -> passed (`sdk:codegen completed (fallback-idl-used)`, exit 0)

## Decision

Renderer status stays `fallback` because the acceptance gate for `working` requires:

1. Codama generation through `pnpm sdk:codegen`
2. Compile success from `cargo build -p susu-client`

Neither can be proven in this environment today.

## Fallback Applied (PRD Cut #4)

- Keep the thin generated/hand-rolled Rust client surface in `sdk/rust/src/generated/`.
- Continue using deterministic fallback generation via `node codama.config.mjs` until toolchain is available.
- Do not promote this status to `partial` or `working` until both commands above run successfully.

## Story 6.4 Rust Client Fallback

Story 6.4 keeps `sdk/rust/src/generated/` read-only and uses it as the Codama
fallback surface for instruction names, account marker types, error names, and
seed constants. The ergonomic Rust SDK layer is hand-rolled in:

- `sdk/rust/src/client.rs` for `SusuClient`, explicit `Cluster`, and simulate-by-default transaction builders.
- `sdk/rust/src/instructions.rs` for same-name Rust builders that call `generated::instructions::*` and use Anchor generated account/instruction structs for encoding.
- `sdk/rust/src/accounts.rs` for account type re-exports and decoders.
- `sdk/rust/src/pdas.rs` for canonical seed-constant PDA derivation through `susu::seeds`.
- `sdk/rust/src/errors.rs` for `thiserror` SDK errors and Anchor custom error code parity.

This is intentionally a fallback until Codama can render a complete Rust client
from the frozen IDL. When Codama Rust output can replace these hand-rolled
helpers, keep the public surface compatible and let Story 6.5 parity checks
catch drift.

## Exit Criteria To Upgrade Status

Run these on a machine with full toolchain:

1. `pnpm install`
2. `pnpm sdk:codegen`
3. `cargo build -p susu-client`

If all succeed and generated instructions/accounts/errors/seeds are complete, change status to `working`.
