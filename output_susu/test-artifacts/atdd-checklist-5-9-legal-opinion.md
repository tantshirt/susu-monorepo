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
storyId: '5.9'
storyKey: 5-9-legal-opinion
storyFile: output_susu/implementation-artifacts/5-9-legal-opinion.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-9-legal-opinion.md
generatedTestFiles:
  - tests/atdd/story-5-9-legal-opinion.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-9-legal-opinion.md
  - output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - docs/fincen-cvc-framing.md
  - docs/threat-model.md
  - docs/architecture-notes.md
---

# ATDD Checklist: Story 5.9 Legal Opinion Engagement And Publication

## Story Summary

Story 5.9 creates the public legal-opinion engagement trail for the FinCEN posture from Story 5.7. It must show the narrow non-custodial / non-fee / non-yield scope, hand counsel the right background documents, publish `docs/legal-opinion.pdf`, and use an explicit placeholder PDF if the firm letter slips past submission close.

## Stack And Mode

- Detected stack: backend/docs monorepo.
- Generation mode: AI generation, no browser recording.
- Primary test level: docs/static plus shell integration smoke.
- Red phase target: `tests/atdd/story-5-9-legal-opinion.static.red.test.mjs` fails until the engagement docs, scripts, placeholder PDF, and public links land.

## Acceptance Criteria Coverage

| AC | Static or integration scenario |
| --- | --- |
| SOW signed T+0 with narrow scope | Verify `docs/legal-engagement.md` tracks firm, SOW signed date/status, expected delivery, and non-custodial / non-fee / non-yield scope. |
| Firm receives FinCEN framing, threat model, and architecture doc | Verify engagement docs and handoff script reference `docs/fincen-cvc-framing.md`, `docs/threat-model.md`, and `docs/architecture-notes.md`. |
| Publish signed scope at `docs/legal-opinion.pdf` | Verify `docs/legal-opinion.pdf` exists and the engagement tracker names it as the publication path. |
| README badge cluster links to PDF | Verify root `README.md` has a badge/link targeting `./docs/legal-opinion.pdf`. |
| Delayed firm letter placeholder links SOW | Verify placeholder renderer exists and the committed PDF contains delayed-letter and SOW-summary text. |
| Engagement logged | Verify `log/2026-05-08.md` records the Story 5.9 legal engagement. |

## Generated Red-Phase Scaffold

- `tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`

The scaffold is active under the repository's static-red convention: it fails before the Story 5.9 artifacts exist and turns green after implementation.

## Implementation Checklist

1. Create `docs/legal-engagement.md` with firm, scope, SOW signed status/date, expected delivery, status, and `docs/legal-opinion.pdf` path.
2. Create a public, non-confidential SOW summary file that can be linked from the placeholder PDF.
3. Add `scripts/legal-handoff.sh` to bundle the FinCEN framing doc, threat model, architecture notes, IDL, and state context into ignored transient output.
4. Add `scripts/render-legal-placeholder.sh` to render a one-page delayed-letter placeholder PDF.
5. Commit `docs/legal-opinion.pdf` as the current placeholder until a firm letter replaces it.
6. Add a root README badge cluster link to `./docs/legal-opinion.pdf`.
7. Link legal engagement docs from `docs/README.md`.
8. Add a transparent log entry in `log/2026-05-08.md`.
9. Run `node --test tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`.
10. Run `bash scripts/legal-handoff.sh --dry-run`.
11. Run `bash scripts/render-legal-placeholder.sh`.

## Risks And Assumptions

- Risk E5-007: legal report links may resolve without required scope. Mitigation: static tests enforce scope, paths, handoff inputs, and placeholder semantics.
- Risk E5-012: vendor engagement artifacts may expose confidential SOW details. Mitigation: commit only a non-confidential public SOW summary and keep handoff bundles ignored.
- The firm letter is not available in this branch. The committed PDF is therefore a placeholder and must not make a legal conclusion.

## Completion Summary

- Test files created: 1 static ATDD scaffold.
- Checklist output path: `output_susu/test-artifacts/atdd-checklist-5-9-legal-opinion.md`.
- Story handoff path: `output_susu/implementation-artifacts/5-9-legal-opinion.md`.
- Next workflow: `bmad-dev-story` for implementation.
