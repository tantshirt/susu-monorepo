---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '5.2'
storyKey: 5-2-adversary-cli-skeleton
storyFile: output_susu/implementation-artifacts/5-2-adversary-cli-skeleton.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-2-adversary-cli-skeleton.md
generatedTestFiles:
  - tests/atdd/story-5-2-adversary-cli-skeleton.atdd.md
  - tests/atdd/story-5-2-adversary-cli-skeleton.static.red.test.mjs
---

# ATDD Checklist: Story 5.2 `susu-adversary` CLI skeleton

## TDD Red Phase

Red-phase acceptance scaffolds were generated from the Story 5.2 acceptance criteria and Epic 5 test design.

- Static ATDD tests: `tests/atdd/story-5-2-adversary-cli-skeleton.static.red.test.mjs`
- BDD scenario notes: `tests/atdd/story-5-2-adversary-cli-skeleton.atdd.md`
- Story handoff: `output_susu/implementation-artifacts/5-2-adversary-cli-skeleton.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 CLI args | Static checks for `clap::Parser`, `--circles`, `--seed`, `--cluster`, and smoke-test output flag. |
| AC2 deterministic RNG | Static checks for 64-char hex validation and `ChaCha20Rng::from_seed(seed_bytes)`. |
| AC3 lifecycle harness | Static checks for skeleton localnet simulator config and randomized lifecycle sampling ranges. |
| AC4 JSON report | Static checks for `RunMetadata`, `Summary`, `PerScenarioResult`, pretty JSON, and trailing newline. |
| AC5 exit code | BDD scenario and implementation checklist require exit 0 for zero max profit and exit 1 for positive max profit. |
| AC6 README | Static checks for `--seed $COMMIT_SHA`, report interpretation, and Story 5.4 determinism handoff. |

## Red-Green Activation

The repository’s existing ATDD convention uses active `node --test` static red tests rather than skipped browser scaffolds. The generated static test intentionally fails against the current placeholder binary and should pass after the Story 5.2 implementation lands.

Run:

```sh
pnpm test:atdd
cargo test --package susu-adversary
```

## Implementation Guidance

- Keep the crate at `crates/susu-adversary/`; architecture pins that path.
- Keep Story 5.2 as a deterministic skeleton: no full Surfpool or 30% Cartel implementation is required in this story.
- Use an `--output` flag for smoke tests so tests can write reports under a temp directory without touching `audits/adversary/adversary-report.json`.
- Use stable placeholder metadata values for Story 5.2; Story 5.4 owns byte-for-byte canonical report reproducibility.
- Avoid nondeterministic sources in any code path that affects the report.

## Validation

- Prerequisites satisfied: Rust workspace, Node ATDD harness, story ACs, Epic 5 test design.
- CLI sessions cleaned up: N/A, no browser automation used.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: `bmad-dev-story` for Story 5.2 implementation.
