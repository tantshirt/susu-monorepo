---
storyId: '5.3'
storyKey: 5-3-thirty-percent-cartel-scenario
reviewDate: '2026-05-08'
reviewMode: full
specFile: output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md
diffBase: origin/main
stepsCompleted:
  - step-01-gather-context
  - step-02-review
  - step-03-triage
  - step-04-present
---

# Code Review: Story 5.3 30% Cartel Scenario

## Scope

Reviewed branch diff against `origin/main` with Story 5.3 as the acceptance spec.

Files reviewed:

- `crates/susu-adversary/README.md`
- `crates/susu-adversary/src/lib.rs`
- `crates/susu-adversary/src/main.rs`
- `crates/susu-adversary/src/report.rs`
- `crates/susu-adversary/src/scenarios/mod.rs`
- `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`
- `crates/susu-adversary/src/simulator.rs`
- `crates/susu-adversary/tests/thirty_percent_cartel.rs`
- Story and ATDD/test-review artifacts for Story 5.3

## Review Layers

| Layer | Result |
| --- | --- |
| Blind Hunter | 1 finding: report projection lost per-defector loss detail. |
| Edge Case Hunter | Same finding, focused on future audit/report legibility. |
| Acceptance Auditor | Same finding against Dev Notes requiring per-defector loss values. |

## Findings

### Fixed

1. **Per-scenario report omitted per-defector net P&L values.**
   - Classification: patch
   - AC/constraint: Dev Notes require `ScenarioResult` to include enough detail for the JSON report, specifically `max_defector_profit_lamports` and per-defector loss values for legibility.
   - Evidence: `ScenarioResult` computed ledgers but `PerScenarioResult` only projected `max_defector_profit_lamports`.
   - Fix: Added `defector_net_pnl_lamports: Vec<i64>` to `ScenarioResult` and `PerScenarioResult`, populated it from defector ledgers, and asserted the expected `[-400_000_000, -400_000_000, -400_000_000]` values in scenario tests.

## Deferred

No deferred findings.

## Dismissed

No findings dismissed as noise.

## Validation

- `cargo fmt --all` passed.
- `cargo test --package susu-adversary` passed: 10 tests.
- `node --test tests/atdd/story-5-2-adversary-cli-skeleton.report.red.test.mjs tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs` passed: 6 tests.
- Earlier full-regression gates before this review fix passed: `cargo test --workspace` and `pnpm test:atdd`.

## Outcome

Code review findings were fixed. No unresolved code-review items remain.
