---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-08
storyId: "5.4"
storyKey: 5-4-deterministic-adversary-report
storyFile: output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-4-deterministic-adversary-report.md
generatedTestFiles:
  - tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - output_susu/implementation-artifacts/5-2-adversary-cli-skeleton.md
  - output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md
---

# ATDD Checklist: Story 5.4 Byte-deterministic adversary report

## Step 1: Preflight & Context

- Detected stack: backend Rust CLI with Node static ATDD tests.
- Story file: `output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md`.
- Prerequisites verified: Story 5.2 is merged, Story 5.3 is marked done by user-approved manual override, and sprint status has 5.4 as `ready-for-dev`.
- Existing framework: `cargo test --package susu-adversary` and `pnpm test:atdd`.

## Step 2: Generation Mode

AI generation was used. Browser recording is not relevant for a backend deterministic CLI/report story.

## Step 3: Test Strategy

| AC | Test ID | Level | Priority | Red-phase coverage |
| --- | --- | --- | --- | --- |
| AC1 byte-identical same seed | 5.4-E2E-001 | Rust integration + CI | P0 | Static test requires `deterministic_report.rs`; Rust test shells out twice and compares bytes. |
| AC2 10K no profitable defector | 5.4-E2E-002 | Script/CI | P0 | Static test requires a 10,000-circle guard and summary validation. |
| AC3 <=10 minute budget | 5.4-E2E-003 | Script/CI | P0 | Static test requires timeout/budget documentation in `check-adversary-determinism.sh`. |
| AC4 forbidden nondeterminism | 5.4-UNIT-004 | Static | P0 | Static test rejects time, unseeded RNG, env/process/thread/host values, unordered report iteration, and floats. |
| AC5 reproduction docs | 5.4-DOC-005 | Docs/static | P1 | Static test requires `audits/adversary/README.md` and canonical report path. |
| AC6 stable report contract | 5.4-INT-006 | Static + Rust integration | P1 | Static test requires sorted arrays, pretty JSON, and trailing newline. |

## Step 4: Red-Phase Scaffolds

- BDD scenarios: `tests/atdd/story-5-4-deterministic-adversary-report.atdd.md`
- Static red test: `tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs`

These tests intentionally fail before implementation because the deterministic Rust test, audit README, canonical report artifact, CI script, 40-character seed support, and stable sorting are not yet present.

## Step 5: Validation

- All acceptance criteria have mapped test coverage.
- Red-phase static tests assert expected behavior rather than placeholders.
- No browser or temp artifacts were created.
- Next workflow: `/bmad-dev-story` for Story 5.4 implementation.

