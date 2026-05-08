---
workflowStatus: completed
totalSteps: 5
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '5.7'
storyKey: 5-7-fincen-cvc-framing-doc
storyFile: output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-7-fincen-cvc-framing-doc.md
generatedTestFiles:
  - tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - scripts/check-fincen-posture.sh
  - docs/threat-model.md
---

# ATDD Checklist: Story 5.7 FinCEN CVC Framing Doc

## Story Summary

Story 5.7 creates `docs/fincen-cvc-framing.md`, a public structural framing note for Susu's non-custodial, non-fee, and non-yield posture under FinCEN FIN-2019-G001. The document must be useful to judges, integrators, and compliance reviewers while staying inside an engineering posture boundary.

## Stack And Mode

- Detected stack: backend/docs monorepo.
- Generation mode: AI generation, sequential fallback. No browser recording is relevant.
- Primary test level: docs/static.
- Red phase target: `tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs` fails until `docs/fincen-cvc-framing.md` lands with required content.

## Acceptance Criteria Coverage

| AC | Static scenario |
| --- | --- |
| `## TL;DR` explains structural posture under FinCEN 2019 CVC guidance | Verify heading, FIN-2019-G001 reference, May 9, 2019 date, and posture disclaimer. |
| Three structural clauses | Verify non-custodial key posture, no fee path, and no yield-routing CPI language. |
| Cite structural enforcement | Verify `scripts/check-fincen-posture.sh` is cited and that the file exists. |
| Forfeiture and legal re-review triggers | Verify admin instruction, upgrade authority, protocol fee, yield CPI, keeper/scheduler, and non-user-derived custody appear. |
| No legal claims; point to legal opinion | Verify the doc says it is not legal advice/conclusion and points to Story 5.9 / `docs/legal-opinion.pdf`. |

## Generated Red-Phase Scaffold

- `tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs`

The scaffold asserts expected behavior directly. It is intentionally active in this repo's static-red convention, so it fails before the Story 5.7 document exists and turns green after implementation.

## Implementation Checklist

1. Create `docs/fincen-cvc-framing.md`.
2. Include a short `## TL;DR` that frames the current code posture without making a legal conclusion.
3. Add a source section for FinCEN FIN-2019-G001 with the official FinCEN URL.
4. Enumerate the three structural clauses using the exact current-program surfaces.
5. Explain how `scripts/check-fincen-posture.sh` enforces custody, fee/yield, and CPI posture.
6. List posture-forfeiting changes that require counsel re-review.
7. Point readers to Story 5.9 and `docs/legal-opinion.pdf`.
8. Run `node --test tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs`.
9. Run `bash scripts/check-fincen-posture.sh`.

## Risks And Assumptions

- Risk E5-011: the framing may overclaim a legal conclusion. Mitigation: explicit "not legal advice/not a legal conclusion" wording and forward pointer to Story 5.9.
- Story 5.9 has not landed yet. The doc may reference `docs/legal-opinion.pdf` as a future artifact, but must say the firm letter controls legal conclusions once available.
- This story does not change program custody, fee, CPI, or IDL surfaces.

## Completion Summary

- Test files created: 1 static ATDD scaffold.
- Checklist output path: `output_susu/test-artifacts/atdd-checklist-5-7-fincen-cvc-framing-doc.md`.
- Story handoff path: `output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md`.
- Next workflow: `bmad-dev-story` for implementation.
