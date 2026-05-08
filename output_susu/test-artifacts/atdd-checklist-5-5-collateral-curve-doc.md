---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '5.5'
storyKey: 5-5-collateral-curve-doc
storyFile: output_susu/implementation-artifacts/5-5-collateral-curve-doc.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-5-collateral-curve-doc.md
generatedTestFiles:
  - tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-5-collateral-curve-doc.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - programs/susu/src/curve.rs
  - tests/invariants/no_strategic_default.rs
  - audits/adversary/adversary-report.json
---

# ATDD Checklist: Story 5.5 `docs/collateral-curve.md`

## TDD Red Phase

Red-phase acceptance scaffolds were generated from GitHub issue #48, the Epic 5 test design, and the canonical curve implementation.

- Static documentation guard: `tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`
- BDD scenarios: `tests/atdd/story-5-5-collateral-curve-doc.atdd.md`
- Story file handoff: `output_susu/implementation-artifacts/5-5-collateral-curve-doc.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 TL;DR first section | Static test verifies `## TL;DR` is the first section after the H1 and states the Curve Invariant. |
| AC2 closed-form formula | Static test verifies the inline formula `C_i = c(2n - 1 - i)` or equivalent notation is present. |
| AC3 derivation | Static test verifies a derivation section contains the slot-`i` payoff expression and strict negative result. |
| AC4 worked examples | Static test verifies `n = 3`, `n = 5`, and `n = 10` USDC example rows against formula-derived values. |
| AC5 proof sketch | Static test verifies a proof sketch section exists and includes assumptions, monotonic reasoning, and the strict-negative conclusion. |
| AC6 evidence paths | Static test verifies cited paths exist for `tests/invariants/no_strategic_default.rs`, `audits/adversary/adversary-report.json`, and `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`. |
| AC7 comprehension review | Static test verifies the story completion record captures a non-cryptoeconomist developer review with outcome. |

## Test Strategy

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.5-DOC-001 | P0 | Docs/static | Doc starts with `## TL;DR`, defines Curve Invariant, includes formula, derivation, proof sketch, and verifier paths. | E5-013 |
| 5.5-DOC-002 | P0 | Fixture/doc | Worked examples for `n in {3,5,10}` are verified against the curve formula. | E5-013 |
| 5.5-DOC-003 | P0 | Link check | Links to invariant and adversary evidence artifacts resolve. | E5-013 |
| 5.5-DOC-004 | P1 | Comprehension | External non-cryptoeconomist developer review is captured in the completion record. | E5-013 |
| 5.5-DOC-005 | P1 | Markdown/render | Document remains plain Markdown with inline math notation suitable for GitHub rendering. | E5-014 |

## Red-Phase Execution

Expected red command before implementation:

```bash
node --test tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs
```

The command should fail before implementation because `docs/collateral-curve.md` does not yet exist and the comprehension review is pending.

## Implementation Guidance

- Keep `programs/susu/src/curve.rs` as the source of truth for formula semantics.
- Use one contribution amount across the worked examples so readers can compare group-size effects directly.
- Avoid overstating proof strength: call the proof sketch informal and point to `tests/invariants/no_strategic_default.rs` plus `audits/adversary/adversary-report.json` as evidence artifacts.
- Include `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` as the named scenario path required by the Epic 5 test design link check.
- Capture review evidence in the story record rather than inventing a separate process artifact.

## Validation Summary

- Prerequisites: Story 5.1 and Story 5.4 are both marked `done` in `output_susu/implementation-artifacts/sprint-status.yaml`.
- Generation mode: sequential AI generation; this is a documentation/static-link story with no browser journey.
- TDD phase: red-phase static acceptance test committed before implementation.
