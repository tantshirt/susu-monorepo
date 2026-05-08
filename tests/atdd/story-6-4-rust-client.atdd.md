# Story 6.4 ATDD: Rust client parity surface

## Scope

Story 6.4 ships the Rust `susu-client` crate with the same public integration surface as the TypeScript SDK from Stories 6.1-6.3.

## Acceptance Tests

1. `cargo build -p susu-client --release` succeeds for a publishable crate named `susu-client` at `0.1.0-alpha.0`.
2. `sdk/rust/src/lib.rs` re-exports `client`, `instructions`, `accounts`, `pdas`, `errors`, and `generated`.
3. `sdk/rust/src/client.rs` exposes `SusuClient::new(Cluster, RpcClient)` and state-changing builders named `create_group`, `accept_invite`, `post_collateral`, `contribute`, `claim_payout`, `top_up_collateral`, `withdraw_collateral`, and `cancel_group`.
4. State-changing Rust builders simulate by default and expose a `with_simulate(false)` override before `send()`.
5. `sdk/rust/src/pdas.rs` derives `group_pda`, `member_pda`, `vault_pda`, and `rotation_history_pda` exclusively through canonical seed constants re-exported from the program seeds module.
6. `sdk/rust/src/errors.rs` exposes a `thiserror::Error`-derived `SusuError` and a `SusuProgramError` enum whose variant names and codes mirror the Anchor program error enum.
7. `sdk/rust/tests/parity.rs` contains hard-coded PDA vectors asserted bit-for-bit against Rust derivation output.
8. Because Codama Rust remains in fallback status, `docs/codama-rust-status.md` documents which surface is generated and which Story 6.4 helpers are hand-rolled.

## Red/Green Commands

- Red/static gate: `node --test tests/atdd/story-6-4-rust-client.static.red.test.mjs`
- Rust gate: `cargo test -p susu-client`
- Build gate: `cargo build -p susu-client --release`
