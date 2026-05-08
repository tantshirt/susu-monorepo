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
storyId: '5.8'
storyKey: 5-8-audit-engagement
storyFile: output_susu/implementation-artifacts/5-8-audit-engagement.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-8-audit-engagement.md
generatedTestFiles:
  - tests/atdd/story-5-8-audit-engagement.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/5-8-audit-engagement.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - output_susu/implementation-artifacts/sprint-status.yaml
  - output_susu/planning-artifacts/prd.md
  - output_susu/planning-artifacts/architecture.md
  - output_susu/planning-artifacts/epics.md
---

# ATDD Checklist: Story 5.8 Audit firm engagement + report linking

## Step 1: Preflight & Context

- Detected stack: backend/static repository checks.
- Test framework pattern: existing `node:test` red tests under `tests/atdd/*.red.test.mjs`, run by `pnpm test:atdd`.
- Story context source: GitHub issue #51 plus local BMad story artifact.
- Key constraint: do not fabricate upstream Epic 5 artifacts owned by concurrent stories.

## Step 2: Generation Mode

- Mode: AI generation.
- Browser recording: not applicable; this story has no UI flow.
- Execution mode: sequential, because generated tests are repository static/script checks.

## Step 3: Test Strategy

| Acceptance Criterion | Priority | Level | Red-phase scenario |
| --- | --- | --- | --- |
| AC1 audit index | P0 | Static docs | `audits/README.md` has the locked sections, table columns, and primary engagement row. |
| AC2 SOW handling | P1 | Static docs | README links to either public SOW PDF or non-confidential summary; summary exists when PDF is absent. |
| AC3 Day-1 bundle | P0 | Script integration | `scripts/audit-handoff.sh` can package a complete fixture tree into a gitignored handoff tarball with manifest. |
| AC4 report citations | P0 | Script unit | `scripts/check-audit-report-citations.sh` passes when both required path citations are present and fails when one is missing. |
| AC5 badge transition | P1 | Static docs | Badge transition is documented in `audits/README.md` without editing root README. |
| AC6 findings tracker | P1 | Static docs/process | Audit-finding labels and mitigation issue workflow are documented. |

## Step 4: Generated Red Tests

- `tests/atdd/story-5-8-audit-engagement.static.red.test.mjs`

The tests follow the repo's active red-test convention rather than skipped Playwright scaffolds, because the repository already uses `node:test` for ATDD. They should fail before Story 5.8 implementation and pass after the docs/scripts land.

## Step 5: Validation

- Story metadata and handoff paths are captured.
- Test file path is deterministic and story-scoped.
- No browser sessions were opened.
- Temp outputs are not required for this static/backend story.

## Next Workflow

Run `bmad-dev-story` for `output_susu/implementation-artifacts/5-8-audit-engagement.md`, then run test-review and code-review before PR gates.
