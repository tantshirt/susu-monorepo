# Story 6.5: SDK parity CI check

Status: review

## Story

As Andre and the audit firm,
I want `scripts/check-sdk-parity.sh` regenerating both SDK clients from the frozen IDL on every PR and asserting their public API surfaces are identical (instruction names, account structs, error codes),
so that drift between TS and Rust SDKs is structurally impossible.

## Acceptance Criteria

1. **Given** Stories 6.1–6.4 land, **when** a PR opens, **then** `scripts/check-sdk-parity.sh` runs `pnpm sdk:codegen` and diffs the generated outputs against the committed `sdk/ts/src/generated/` and `sdk/rust/src/generated/`.
2. The script extracts the instruction-name list, account-struct names, and error-code names from each generated tree and asserts the sets are identical.
3. Any divergence exits 1 and fails CI.
4. The parity job is wired into `.github/workflows/ci.yml`.
5. The script handles the documented edge case where Codama renames `snake_case` ↔ `camelCase` (the parity is checked at the Codama-managed mapping level, not lexical).

## Tasks / Subtasks

- [ ] Author `scripts/check-sdk-parity.sh` (AC: 1, 2, 3)
  - [ ] Bash strict mode (`set -euo pipefail`)
  - [ ] Step 1: regenerate via `pnpm sdk:codegen`
  - [ ] Step 2: `git diff --exit-code -- sdk/ts/src/generated sdk/rust/src/generated` → fails if regen produced diff (ensures committed `generated/` is in sync with frozen IDL)
  - [ ] Step 3: extract surface from TS via small Node script `scripts/extract-ts-surface.mjs` (parses `sdk/ts/src/generated/instructions/index.ts`, `accounts/index.ts`, `errors/index.ts`)
  - [ ] Step 4: extract surface from Rust via `cargo run --bin extract-rust-surface` (or `cargo expand` parsing) at `crates/extract-rust-surface/`
  - [ ] Step 5: normalize names through Codama mapping (TS `camelCase` ↔ Rust `snake_case`) — apply consistent transformation
  - [ ] Step 6: diff the normalized sets — instructions, accounts, errors
  - [ ] Exit 0 if sets match; exit 1 with structured diff output if not
- [ ] Author `scripts/extract-ts-surface.mjs` (AC: 2, 5)
  - [ ] Reads `sdk/ts/src/generated/instructions/`, `accounts/`, `errors/` index files
  - [ ] Outputs JSON: `{ instructions: ['createGroup', ...], accounts: ['Group', ...], errors: ['NotEnoughCollateral', ...] }`
- [ ] Author `crates/extract-rust-surface/` binary (AC: 2, 5)
  - [ ] Reads `sdk/rust/src/generated/` modules
  - [ ] Outputs same JSON shape to stdout
  - [ ] Add to root `Cargo.toml` workspace members
- [ ] Wire into `.github/workflows/ci.yml` (AC: 4)
  - [ ] New job `sdk-parity` depends on `sdk-codegen` step
  - [ ] Runs `bash scripts/check-sdk-parity.sh`
  - [ ] Fails the workflow on non-zero exit
- [ ] Document the edge case (AC: 5)
  - [ ] Comment in `check-sdk-parity.sh` explaining the case-mapping normalization
  - [ ] `docs/codama-rust-status.md` notes the mapping convention

## Dev Notes

### Architecture compliance (non-negotiables)

- **Parity is structural.** This script + CI job is *the* mechanism that prevents TS-Rust drift. Without it, Codama generation could silently diverge over time. Treat any failure as a release-blocker.
- **Re-codegen is mandatory in the check.** Just diffing committed surfaces isn't enough — we must prove that *re-running codegen against the frozen IDL produces the committed output*. Step 2 (`git diff --exit-code` post-regen) is the load-bearing assertion.
- **Frozen IDL is the source of truth.** The IDL hash check (separate script `scripts/check-idl-hash.sh`, Story 1.x) and this parity check are siblings — both treat `IDL_FREEZE.md`'s hash as canonical.
- **Case normalization is the only allowed transformation.** Do not paper over real differences (missing instruction in Rust, extra error in TS) by adding case-fold "fixes" — those are bugs to investigate.

### Source tree (this story creates/modifies)

```
scripts/
├── check-sdk-parity.sh           # CREATE
└── extract-ts-surface.mjs        # CREATE

crates/
└── extract-rust-surface/         # CREATE
    ├── Cargo.toml
    └── src/main.rs

.github/workflows/
└── ci.yml                        # MODIFY — add sdk-parity job

docs/
└── codama-rust-status.md         # MODIFY — case-mapping note
```

### Project Structure Notes

- Depends on Stories 6.1, 6.4 (both SDKs exist and have `generated/`), and Story 1.3 (`pnpm sdk:codegen` works).
- The `extract-rust-surface` crate is a workspace member registered in root `Cargo.toml`. Intentionally not under `sdk/` — it is tooling, not a published crate.
- The script assumes `pnpm sdk:codegen` is deterministic given a fixed IDL. If determinism is in doubt, Story 1.3 should have addressed it; flag in `log/`.

### Forbidden patterns

- Skipping the regen step (just diffing committed surfaces) — defeats the purpose.
- Loose case-folding that hides real differences — only the documented Codama TS↔Rust naming convention is normalized.
- Hard-coding instruction lists in the script — must derive from the generated files dynamically.
- Running the parity check only on `main` — must run on every PR (catches drift at PR time, not after merge).

### Testing standards

- The script is itself "tested" by CI: a test PR that intentionally edits one generated file should fail the parity check. Document this manual smoke test in `docs/codama-rust-status.md`.
- No unit tests for bash; integration via CI is the test.

### References

- [epics.md §Epic 6 / Story 6.5](../planning-artifacts/epics.md) — BDD ACs
- [architecture.md §Core Architectural Decisions](../planning-artifacts/architecture.md) — SDK parity strategy
- [prd.md §FR33](../planning-artifacts/prd.md) — parity check requirement
- [Story 6.1](6-1-ts-sdk-fluent-client.md), [Story 6.4](6-4-rust-client.md) — surfaces being checked

## Dev Agent Record

### Agent Model Used

_TBD_

### Debug Log References

### Completion Notes List

- Structural parity enforced via codegen regen (`git diff --exit-code`) plus `extract-ts-surface` / `extract-rust-surface` / `compare-sdk-surfaces`.

### File List

- `scripts/check-sdk-parity.sh`, `scripts/extract-ts-surface.mjs`, `scripts/compare-sdk-surfaces.mjs`
- `crates/extract-rust-surface/`
- `tests/atdd/story-6-5-sdk-parity-ci.atdd.md`, `tests/atdd/story-6-5-sdk-parity-ci.static.red.test.mjs`
- `docs/codama-rust-status.md` (mapping note), `Cargo.lock`
- `package.json` (root `pnpm test`), `output_susu/implementation-artifacts/sprint-status.yaml`, `dependency-graph.md`
