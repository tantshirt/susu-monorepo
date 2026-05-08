---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '5.6'
storyKey: 5-6-threat-model-doc
storyFile: output_susu/implementation-artifacts/5-6-threat-model-doc.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-6-threat-model-doc.md
generatedTestFiles:
  - tests/atdd/story-5-6-threat-model-doc.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-6-threat-model-doc.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - docs/threat-model.md
  - tests/coverage/threat-model.md
  - _bmad/config.yaml
---

# ATDD Checklist: Story 5.6 Threat Model Doc

## Preflight and Context

- Detected stack: backend/fullstack repository with Rust Anchor program tests and Node static ATDD tests.
- Story source: GitHub issue #49, persisted to `output_susu/implementation-artifacts/5-6-threat-model-doc.md`.
- Existing test command pattern: `node --test tests/atdd/*.red.test.mjs`.
- Red-phase strategy: static document contract test. It fails until the threat model and coverage matrix satisfy the story acceptance criteria.

## Generation Mode

AI generation was selected. Story 5.6 is documentation and traceability work; no browser recording is required.

## Acceptance Criteria Coverage

| Acceptance criterion | Test coverage |
| --- | --- |
| Required adversary models are enumerated | `tests/atdd/story-5-6-threat-model-doc.static.red.test.mjs` checks required section headings and attack tokens. |
| Each adversary states vector, mitigation, residual risk | The static test checks every required attack section for those labels. |
| Coverage matrix has `attack`, `mitigation`, `test_file_path` columns | The static test parses `tests/coverage/threat-model.md` and validates the exact header names. |
| Every documented attack has a referenced test file | The static test requires at least one row for each required attack. |
| Every referenced test file exists | The static test verifies each cited path with `existsSync`. |
| Immutability is both a security feature and no-hotfix constraint | The static test checks the immutability section for both claims. |

## Generated Files

- `tests/atdd/story-5-6-threat-model-doc.static.red.test.mjs`
- `output_susu/implementation-artifacts/5-6-threat-model-doc.md`

## Validation

- Red phase before implementation: expected to fail against the pre-existing short threat model because required adversaries and coverage rows are missing.
- Green phase after implementation: expected to pass with only existing repository paths in the coverage matrix.

## Next Workflow

Run `bmad-dev-story` for Story 5.6, then run `bmad-testarch-test-review` and `bmad-code-review`.
