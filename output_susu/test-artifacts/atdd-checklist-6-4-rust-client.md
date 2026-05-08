---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-09'
storyId: '6.4'
storyKey: 6-4-rust-client
storyFile: output_susu/implementation-artifacts/6-4-rust-client.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-4-rust-client.md
generatedTestFiles:
  - tests/atdd/story-6-4-rust-client.atdd.md
  - tests/atdd/story-6-4-rust-client.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-4-rust-client.md
  - output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md
  - output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md
  - output_susu/implementation-artifacts/6-3-sdk-error-classes.md
  - docs/codama-rust-status.md
---

# ATDD Checklist: Story 6.4 Rust Client

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.4 acceptance criteria and the existing TypeScript SDK surface.

- BDD scenarios: `tests/atdd/story-6-4-rust-client.atdd.md`
- Static red test: `tests/atdd/story-6-4-rust-client.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-4-rust-client.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 publishable Rust crate | Static test checks `susu-client` metadata, release version, license, publish flag, and required dependencies. Rust gate runs `cargo build -p susu-client --release`. |
| AC2 TS helper parity | Static test requires Rust builder names for the Story 6.1-6.3 state-changing helpers plus read methods on `SusuClient`. |
| AC3 typed errors | Static test verifies `thiserror::Error`, SDK error categories, `SusuProgramError`, and all Anchor program variants. |
| AC4 canonical PDA seeds | Static test verifies required PDA functions and rejects seed byte literals in `sdk/rust/src/pdas.rs`. |
| AC5 parity vector | Rust integration test `sdk/rust/tests/parity.rs` pins hard-coded PDA + bump vectors. TS parity placeholder carries the same Story 6.4 vector. |
| AC6 Codama fallback doc | Static test requires `docs/codama-rust-status.md` to document the Story 6.4 hand-rolled fallback layer. |

## Red-Green Activation

Initial red run failed all seven static checks against the Story 1.3 Rust skeleton. Green validation now passes:

```sh
node --test tests/atdd/story-6-4-rust-client.static.red.test.mjs
cargo test -p susu-client
cargo build -p susu-client --release
```

## Implementation Guidance

- Keep `sdk/rust/src/generated/` read-only.
- Use `susu::seeds` as the single source for PDA seed constants.
- Use Anchor generated account/instruction structs for account metas and instruction data instead of writing discriminators manually.
- Keep Story 6.5 responsible for activating full cross-language generated-output parity.

## Validation

- Prerequisites satisfied: Story ACs are explicit, Rust crate exists, Codama fallback status exists.
- Generation mode: sequential static red-test generation using the repo's ATDD convention.
- CLI sessions cleaned up: yes.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: Story 6.4 implementation and review.
