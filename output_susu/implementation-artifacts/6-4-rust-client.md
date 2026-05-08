# Story 6.4: Codama-generated Rust client (susu-client) with same surface

Status: review

## Story

As an integrator using Rust,
I want `susu-client` (crates.io) to expose the same instruction surface, account decoders, and error codes as `@susu/sdk`,
so that backend integrators have a first-class Rust path with no parity drift.

## Acceptance Criteria

1. **Given** the Codama Rust output from Epic 1 Story 1.3 and the TS SDK from Stories 6.1–6.3, **when** `cargo build -p susu-client --release` runs, **then** the build succeeds and produces a publishable crate.
2. Every TS helper has a corresponding Rust idiomatic builder with the same instruction name (in `snake_case`).
3. Every TS error class has a corresponding Rust `enum` variant via `thiserror::Error`.
4. PDA derivation in `sdk/rust/src/pdas.rs` uses the canonical `seeds` constants module, not string literals.
5. Unit tests in `sdk/rust/tests/parity.rs` verify a known PDA derivation matches between TS and Rust outputs.
6. If Codama Rust renderer maturity gaps prevent full parity (per Story 1.6 spike), this story executes against the documented hand-rolled fallback and the gap is noted in `docs/codama-rust-status.md`.

## Tasks / Subtasks

- [x] Configure `sdk/rust/` crate (AC: 1)
  - [x] `Cargo.toml`: name `susu-client`, version `0.1.0-alpha.0`, edition 2021, `publish = true`, license MIT
  - [x] Dependencies: `solana-sdk`, `solana-client`, `thiserror`, `borsh` (versions pinned to match Anchor 1.0)
  - [x] `lib.rs` re-exports `client`, `instructions`, `accounts`, `pdas`, `errors`, generated module
- [x] Author idiomatic builder API at `sdk/rust/src/client.rs` (AC: 2)
  - [x] `SusuClient::new(cluster: Cluster, rpc: RpcClient) -> Self` — explicit cluster (mirrors TS)
  - [x] Builder methods: `create_group`, `accept_invite`, `post_collateral`, `contribute`, `claim_payout`, `top_up_collateral`, `withdraw_collateral`, `cancel_group`, `get_group`, `get_member_position`, `query_history`
  - [x] Each state-changing builder returns `Result<Signature, SusuError>` and simulates-by-default (mirror TS Story 6.2 — `.with_simulate(false)` is the escape hatch)
  - [x] Each delegates to the Codama-generated `instructions/` module — no hand-rolled encoding
- [x] Author `sdk/rust/src/pdas.rs` (AC: 4)
  - [x] Re-export seed constants from `programs/susu/src/seeds.rs` via a published `susu-seeds` crate or path dependency
  - [x] PDA derivation functions: `group_pda`, `member_pda`, `vault_pda`, `rotation_history_pda` — all use the seed constants, no `b"group"` literals
- [x] Author `sdk/rust/src/errors.rs` (AC: 3)
  - [x] `#[derive(thiserror::Error)] pub enum SusuError { Program(SusuProgramError), Simulation { logs: Vec<String> }, Rpc(...), Cluster {...} }`
  - [x] `SusuProgramError` enum mirrors Anchor `SusuError` enum from program (codes match)
  - [x] Implement `From<solana_client::client_error::ClientError>` → `SusuError::Rpc`
- [x] Author `sdk/rust/tests/parity.rs` (AC: 5)
  - [x] Hard-coded test vector: known seeds → expected PDA Pubkey + bump
  - [x] Test asserts Rust derivation matches the vector bit-for-bit
  - [x] Same vector is also asserted in `sdk/ts/tests/parity.test.ts` (Story 6.5 wires the cross-language assertion)
- [x] Document Codama Rust gaps if any (AC: 6)
  - [x] `docs/codama-rust-status.md` — what Codama generates, what is hand-rolled, why
  - [x] Reference Story 1.6 spike findings; if no gaps, the doc declares "full Codama Rust coverage at frozen IDL hash"

## Dev Notes

### Architecture compliance (non-negotiables)

- **TS-Rust parity is structural, not aspirational.** Story 6.5 ships the parity check that fails CI on drift. This story's job is to *ensure* parity at the surface level: instruction names match (`snake_case` ↔ `camelCase`), account types match, error variants match.
- **Seed constants single-sourced.** The program at `programs/susu/src/seeds.rs` is the canonical source. The Rust SDK re-exports them; the TS SDK reads them via codegen. No `b"group"` byte literals in `sdk/rust/src/`.
- **Simulate-by-default mirrored from TS.** The Rust builder's `send()` simulates first by default; `.with_simulate(false)` opts out. Same semantics as TS.
- **Explicit cluster mirrored from TS.** `SusuClient::new(Cluster::Devnet, rpc)` — no defaulting; passing `Cluster::Mainnet` is required for mainnet ops.
- **Codama Rust renderer maturity.** Story 1.6 ran a spike on this; if gaps exist (e.g., generated builder ergonomics insufficient), this story uses the documented fallback. Do not silently hand-roll without updating `docs/codama-rust-status.md`.
- **Anchor 1.0 toolchain.** Rust crate must build under the toolchain pinned in `rust-toolchain.toml` (Story 1.1).

### Source tree (this story creates/modifies)

```
sdk/rust/
├── Cargo.toml                    # MODIFY — publishable metadata
├── README.md                     # CREATE — quickstart
└── src/
    ├── lib.rs                    # CREATE — re-export modules
    ├── client.rs                 # CREATE — SusuClient builder
    ├── pdas.rs                   # CREATE — PDA derivers using seed consts
    ├── errors.rs                 # CREATE — thiserror enum
    └── generated/                # READ-ONLY (Story 1.3 owns)

sdk/rust/tests/
└── parity.rs                     # CREATE — PDA + surface assertions

docs/
└── codama-rust-status.md         # CREATE — Codama coverage status
```

### Project Structure Notes

- Depends on Story 1.3 (Codama Rust output at `sdk/rust/src/generated/`) and Story 1.2 (frozen IDL → seeds module). No IDL re-freeze — surface is locked.
- Cargo workspace member registered in root `Cargo.toml` (Story 1.1).
- `seeds` constants either live as a published `susu-seeds` crate or as a path dependency from `programs/susu/src/seeds.rs`. Pick path dependency for v0.1 simplicity; if `susu-client` consumers want zero-program-dep, refactor to a separate crate later.

### Forbidden patterns

- `b"group"`, `b"member"`, `b"vault"`, `b"rotation"` literals in `sdk/rust/src/` — must use seed constants.
- Hand-rolled `Instruction { program_id, accounts, data }` builders — go through `generated/instructions/`.
- Editing `sdk/rust/src/generated/` — read-only.
- Default `Cluster` in `SusuClient::new` — must be explicit.
- Direct `RpcClient::send_transaction` outside the simulate-then-send wrapper.

### Testing standards

- `cargo test -p susu-client` runs unit + parity tests. CI runs this on every PR (Story 1.4).
- Parity test vectors live in `sdk/rust/tests/parity.rs` AND `sdk/ts/tests/parity.test.ts` — same vectors, asserted in both languages. The cross-language structural diff lands in Story 6.5.
- Coverage gate ≥80% on `sdk/rust/src/` (excluding `generated/`).

### References

- [epics.md §Epic 6 / Story 6.4](../planning-artifacts/epics.md) — BDD ACs
- [architecture.md §Project Structure](../planning-artifacts/architecture.md) — `sdk/rust/` layout
- [architecture.md §Implementation Patterns & Consistency Rules](../planning-artifacts/architecture.md) — seed constants single-source
- [prd.md §FR32](../planning-artifacts/prd.md) — Rust client functional requirement
- [Story 1.6](1-6-codama-spike.md) — Codama Rust renderer maturity findings (if it exists; else log/spike notes)
- [Story 6.1](6-1-ts-sdk-fluent-client.md), [6.2](6-2-sdk-simulate-cluster-gate.md), [6.3](6-3-sdk-error-classes.md) — TS surface to mirror

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `node --test tests/atdd/story-6-4-rust-client.static.red.test.mjs`
- `cargo test -p susu-client`
- `cargo build -p susu-client --release`
- `pnpm --dir sdk/ts test`
- `RUSTUP_TOOLCHAIN=stable anchor build --ignore-keys`
- `RUSTUP_TOOLCHAIN=stable cargo test --workspace`
- `RUSTUP_TOOLCHAIN=stable cargo test --test no_strategic_default --release`
- `RUSTUP_TOOLCHAIN=stable bash scripts/check-adversary-determinism.sh`
- `bash scripts/check-sdk-parity.sh`
- `bash scripts/check-patterns.sh`
- `bash scripts/check-idl-hash.sh`

### Completion Notes List

- Added `susu-client` publishable crate metadata and direct runtime dependencies required by the Rust SDK layer.
- Added public Rust modules for account decoders, client builders, typed errors, Anchor-backed instruction builders, and canonical PDA helpers.
- Kept `sdk/rust/src/generated/` read-only; Story 6.4 fallback builders call `generated::instructions::*` for public instruction identity and use Anchor generated account/instruction structs for account metas and instruction data.
- Added hard-coded Rust PDA parity vectors and mirrored the Story 6.4 vector in the TS parity placeholder for Story 6.5 activation.
- Updated `docs/codama-rust-status.md` to document the Story 6.4 hand-rolled fallback layer.

### File List

- `Cargo.lock`
- `docs/codama-rust-status.md`
- `output_susu/implementation-artifacts/6-4-rust-client.md`
- `output_susu/test-artifacts/atdd-checklist-6-4-rust-client.md`
- `output_susu/test-artifacts/code-reviews/story-6-4-code-review.md`
- `output_susu/test-artifacts/test-reviews/story-6-4-test-review.md`
- `sdk/rust/Cargo.toml`
- `sdk/rust/README.md`
- `sdk/rust/src/accounts.rs`
- `sdk/rust/src/client.rs`
- `sdk/rust/src/errors.rs`
- `sdk/rust/src/instructions.rs`
- `sdk/rust/src/lib.rs`
- `sdk/rust/src/pdas.rs`
- `sdk/rust/src/queries.rs`
- `sdk/rust/tests/parity.rs`
- `sdk/ts/tests/parity.test.ts`
- `tests/atdd/story-6-4-rust-client.atdd.md`
- `tests/atdd/story-6-4-rust-client.static.red.test.mjs`

### Change Log

- 2026-05-09: Implemented Story 6.4 Rust client fallback surface and local BAD gates.
