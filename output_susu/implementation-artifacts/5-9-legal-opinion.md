# Story 5.9: Legal opinion engagement + docs/legal-opinion.pdf publication

Status: review
Issue: #52

## Story

As Andre,
I want a documented workflow for engaging the crypto-native law firm on Day 1 with narrow scope (non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC), receiving whatever scope they sign by submission close, and publishing it at `docs/legal-opinion.pdf`,
so that the legal-posture appendix lands by submission and the framing in `docs/fincen-cvc-framing.md` is backed by a public letter.

## Acceptance Criteria

1. **Given** the FinCEN framing doc from Story 5.7, **when** the legal engagement workflow runs end-to-end, **then** the SOW is signed by the law firm on T+0 with narrow scope (non-custodial / non-fee / non-yield).
2. The firm receives the FinCEN framing doc, threat model, and architecture doc as background.
3. By submission close, whatever scope the firm has signed is published at `docs/legal-opinion.pdf`, even if narrower than originally hoped.
4. The README links directly to `docs/legal-opinion.pdf` from the badge cluster.
5. If the firm's letter is delayed past submission close, a placeholder note at `docs/legal-opinion.pdf` documents the delay and links to the SOW.
6. The engagement is logged in `/log/2026-XX-XX.md` for transparency.

## Tasks / Subtasks

- [x] Generate Story 5.9 ATDD artifacts.
  - [x] Create a static acceptance scaffold for legal engagement publication.
  - [x] Create an ATDD checklist mapping issue #52 ACs to tests.
- [x] Document the legal engagement workflow.
  - [x] Create `docs/legal-engagement.md` tracking firm, scope, SOW signed date, expected delivery, status, and `docs/legal-opinion.pdf`.
  - [x] Create a public, non-confidential SOW summary path for placeholder linkage.
  - [x] Ensure the workflow references the Story 5.7 FinCEN framing doc, threat model, and architecture doc.
- [x] Add legal handoff and placeholder publication tooling.
  - [x] Add a handoff script that bundles legal background into ignored transient output.
  - [x] Add a placeholder PDF renderer for delayed firm letters.
  - [x] Publish the initial `docs/legal-opinion.pdf` fallback note without overclaiming.
- [x] Wire public links and transparency log.
  - [x] Link the legal opinion from the README badge cluster.
  - [x] Link legal engagement artifacts from `docs/README.md`.
  - [x] Log the engagement in `log/2026-05-08.md`.
- [x] Run local verification.
  - [x] `node --test tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`
  - [x] `bash scripts/legal-handoff.sh --dry-run`
  - [x] `bash scripts/render-legal-placeholder.sh`

## Dev Notes

### Source Inputs

- GitHub issue #52.
- Story 5.7 artifact: `output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md`.
- Public framing document: `docs/fincen-cvc-framing.md`.
- Epic 5 test design, especially risk E5-007 and scenarios 5.9-DOC-001 through 5.9-DOC-005.

### Compliance Boundary

Do not fabricate a law-firm conclusion or imply counsel has signed anything that is still pending. If the firm letter is unavailable, `docs/legal-opinion.pdf` must be a clear placeholder that documents delay status and points to the public SOW summary.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-9-legal-opinion.md`
- Static tests: `tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-08: Loaded issue #52 because the branch did not yet contain a Story 5.9 markdown file.
- 2026-05-08: Confirmed ATDD scaffold red before implementation: 1 passing artifact check, 5 expected failures for missing legal engagement docs/scripts/PDF/links/log.
- 2026-05-08: Verification passed: `node --test tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`, `bash scripts/legal-handoff.sh --dry-run`, `bash scripts/render-legal-placeholder.sh`, `bash scripts/check-fincen-posture.sh`, and `pnpm test:atdd`.

### Implementation Plan

- Keep the public legal-opinion path stable by publishing `docs/legal-opinion.pdf` as a placeholder until a signed firm letter replaces it.
- Keep privileged vendor material out of git by committing only a non-confidential SOW summary and writing handoff bundles under ignored `output_susu/legal-handoff/`.
- Treat `docs/fincen-cvc-framing.md` as engineering background only; no implementation artifact states a law-firm conclusion.

### Completion Notes List

- Generated Story 5.9 ATDD checklist and static acceptance scaffold from issue #52, Story 5.7, and the Epic 5 test design.
- Added public legal engagement tracker, non-confidential SOW summary, placeholder PDF publication workflow, and transient legal handoff script.
- Linked the placeholder legal opinion from the README badge cluster and docs index, and logged the engagement in `log/2026-05-08.md`.
- Story implementation is complete and ready for review; all local acceptance and ATDD checks passed.
- Test review tightened placeholder-PDF and SOW tracker assertions; no open test-quality findings remain.

### File List

- `output_susu/implementation-artifacts/5-9-legal-opinion.md`
- `output_susu/implementation-artifacts/sprint-status.yaml`
- `output_susu/test-artifacts/atdd-checklist-5-9-legal-opinion.md`
- `output_susu/test-artifacts/test-reviews/story-5-9-test-review.md`
- `docs/legal-engagement.md`
- `docs/legal-sow-summary.md`
- `docs/legal-opinion.pdf`
- `docs/README.md`
- `README.md`
- `scripts/legal-handoff.sh`
- `scripts/render-legal-placeholder.sh`
- `log/2026-05-08.md`
- `tests/atdd/story-5-9-legal-opinion.static.red.test.mjs`

### Change Log

- 2026-05-08: Story artifact created from issue #52 and Epic 5 ATDD handoff scope.
- 2026-05-08: Generated ATDD checklist and static red test scaffold.
- 2026-05-08: Implemented legal engagement docs, handoff tooling, placeholder publication, links, and transparency log.
- 2026-05-08: Addressed test-review findings and recorded Story 5.9 test-quality review.
