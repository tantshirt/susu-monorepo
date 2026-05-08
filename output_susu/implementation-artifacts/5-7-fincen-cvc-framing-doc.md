# Story 5.7: FinCEN CVC framing doc

Status: review
Issue: #50

## Story

As a judge, integrator, or compliance reviewer,
I want `docs/fincen-cvc-framing.md` explaining Susu's non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC guidance,
so that the regulatory framing is legible without a 30-minute legal-doc dive.

## Acceptance Criteria

1. **Given** the program design's structural compliance, **when** the framing doc lands, **then** the doc contains a `## TL;DR` explaining why Susu's current structure is framed as outside money-services-business posture under FinCEN 2019 CVC guidance.
2. The doc enumerates the three structural clauses:
   - protocol team holds no keys to user-controlled token accounts,
   - no fee path exists in any instruction handler,
   - no yield-routing CPIs exist.
3. The doc cites `scripts/check-fincen-posture.sh` by file path as the structural enforcement inherited from Story 3.3 / Story 1.4.
4. The doc explicitly states what changes would forfeit the posture and require legal re-review.
5. The doc does not make legal claims; it explains structural posture and points to the legal opinion artifact from Story 5.9 for the firm's letter.

## Tasks / Subtasks

- [x] Generate Story 5.7 ATDD artifacts.
  - [x] Create a static acceptance scaffold for the framing doc.
  - [x] Create an ATDD checklist mapping issue #50 ACs to tests.
- [x] Author `docs/fincen-cvc-framing.md`.
  - [x] Include `## TL;DR`.
  - [x] Cite FinCEN 2019 CVC guidance.
  - [x] Enumerate non-custodial, non-fee, and non-yield structural clauses.
  - [x] Cite `scripts/check-fincen-posture.sh`.
  - [x] List posture-forfeiting changes and re-review triggers.
  - [x] Point to Story 5.9 legal opinion without making legal conclusions.
- [x] Run local verification.
  - [x] `node --test tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs`
  - [x] `bash scripts/check-fincen-posture.sh`

## Dev Notes

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-7-fincen-cvc-framing-doc.md`
- Static tests: `tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs`

### Compliance Boundary

This story is a public engineering-framing artifact, not a legal opinion. The document must avoid categorical legal conclusions and must direct readers to Story 5.9 for counsel's letter.

### Source Inputs

- GitHub issue #50.
- `scripts/check-fincen-posture.sh`
- FinCEN FIN-2019-G001, issued May 9, 2019.
- Epic 5 test design, especially risk E5-011 and scenarios 5.7-DOC-001 through 5.7-DOC-004.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-08: Loaded issue #50 and Epic 5 test design because the branch did not yet contain a Story 5.7 markdown file.

### Completion Notes List

- Added `docs/fincen-cvc-framing.md` with TL;DR, official FinCEN FIN-2019-G001 citation, structural clauses, posture enforcement reference, forfeiture triggers, and Story 5.9 legal-opinion boundary.
- Added active static ATDD coverage for issue #50 acceptance criteria.
- Linked the framing doc from `docs/README.md`.

### File List

- `docs/fincen-cvc-framing.md`
- `docs/README.md`
- `tests/atdd/story-5-7-fincen-cvc-framing-doc.static.red.test.mjs`
- `output_susu/test-artifacts/atdd-checklist-5-7-fincen-cvc-framing-doc.md`
- `output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md`

### Change Log

- 2026-05-08: Story artifact created from issue #50 and ATDD handoff scope.
- 2026-05-08: Implemented FinCEN CVC framing doc and moved story to review.
