# Story 5.8: Audit firm engagement + report linking (FR57, NFR-S1)

Status: review

## Story

As Andre,
I want a documented workflow for engaging the crypto-native audit firm on Day 1, delivering the IDL freeze artifact, receiving the report, and committing it to `audits/firm-name-YYYY-MM.pdf` with README badge linkage,
So that the audit closure is operational and the report's existence becomes a live README signal.

## Acceptance Criteria

1. **Given** the IDL freeze (Epic 1 Story 1.2) and the program implementation (Epics 2-4), **when** the audit engagement workflow runs end-to-end, **then** `audits/README.md` exists as an index of audit artifacts, listing the firm name, scope, engagement date, expected delivery date, and post-delivery report path.
2. The audit SOW (signed Day 1) is committed at `audits/audit-sow.pdf` (or referenced if confidentiality requires summary-only).
3. The firm receives the frozen IDL commit + property test + adversary artifact + threat model on Day 1.
4. When the report lands, it is committed at `audits/firm-name-2026-XX.pdf` and explicitly cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path (as required by NFR-S1).
5. The README badge transitions from `audit-pending` to `audit-passed` (or `audit-findings-tracked` if Informational issues exist).
6. All Informational findings are tracked as public GitHub issues with mitigation status.

## Tasks / Subtasks

- [x] Draft `audits/README.md` index (AC: 1)
  - [x] `# Audits` H1
  - [x] `## Engagement Status` table with columns: `Firm`, `Scope`, `Engagement Date`, `Expected Delivery`, `Status`, `Report Path`
  - [x] One row for the primary audit engagement
  - [x] `## Reproduction & Verification` points to adversary, invariant, threat-model, curve, and FinCEN artifacts
  - [x] `## Findings Tracker` documents public issue-label handling
- [x] Day-1 deliverable bundle (AC: 3)
  - [x] Create `scripts/audit-handoff.sh`
  - [x] Bundle frozen IDL commit/IDL JSON, invariant test, adversary report, threat model, coverage matrix, curve doc, FinCEN framing, and architecture doc
  - [x] Write `audits/handoff-YYYY-MM-DD.tar.gz` and keep it gitignored
  - [x] Include a bundle manifest for audit handoff review
- [x] SOW handling (AC: 2)
  - [x] If sharable, commit `audits/audit-sow.pdf`
  - [x] If confidential or not yet publishable, commit `audits/audit-sow-summary.md`
  - [x] Reference the selected SOW artifact from `audits/README.md`
- [x] Report landing scaffolding (AC: 4)
  - [x] Document report commit recipe at `audits/{firm-slug}-{YYYY-MM}.pdf`
  - [x] Add `scripts/check-audit-report-citations.sh` enforcing the two NFR-S1 path citations
  - [x] Cover positive and negative citation-check behavior with a static ATDD test
- [x] README badge transition workflow (AC: 5)
  - [x] Add TODO in `audits/README.md` for Epic 8 badge wiring
  - [x] Do not edit root `README.md` in this story
- [x] Findings tracker setup (AC: 6)
  - [x] Create or verify GitHub labels `audit-finding` and `audit-finding-resolved`
  - [x] Document mitigation status workflow in `audits/README.md`
- [x] Daily-log entry guidance
  - [x] Document Day-1 handoff and report-delivery log requirements

## Dev Notes

### Architecture compliance

- This is a workflow and public-artifact scaffolding story. The audit firm produces the actual report later; this story creates the index, SOW summary path, handoff script, citation checker, and report landing recipe.
- Path locks: `audits/README.md`, `audits/audit-sow.pdf` or `audits/audit-sow-summary.md`, `audits/{firm-slug}-{YYYY-MM}.pdf`, `scripts/audit-handoff.sh`, and `scripts/check-audit-report-citations.sh`.
- NFR-S1 requires the final audit report to cite both `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path.
- This story must accommodate concurrent Epic 5 root-story PRs. Handoff tooling should report missing upstream artifacts clearly without creating fake versions of artifacts owned by stories 5.1, 5.4, 5.5, or 5.7.
- Do not edit the root `README.md`; Epic 8 owns badge implementation. Story 5.8 documents the transition source of truth in `audits/README.md`.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-8-audit-engagement.md`
- Static acceptance tests: `tests/atdd/story-5-8-audit-engagement.static.red.test.mjs`
- Script acceptance tests: `tests/atdd/story-5-8-audit-engagement.scripts.red.test.mjs`
- Story handoff path: `output_susu/implementation-artifacts/5-8-audit-engagement.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Ran `node --test tests/atdd/story-5-8-audit-engagement.static.red.test.mjs`.
- Ran `node --test tests/atdd/story-5-8-audit-engagement.scripts.red.test.mjs`.
- Ran `pnpm test:atdd`.
- Ran `GIT_PAGER=cat pnpm test:atdd`.
- Ran `bash scripts/audit-handoff.sh --allow-missing --firm primary-audit-firm --date 2026-05-08` and removed the generated gitignored bundle artifacts after validation.
- Created or verified GitHub labels `audit-finding` and `audit-finding-resolved`.

### Completion Notes List

- Implemented `audits/README.md` as the audit engagement index with SOW handling, Day-1 handoff instructions, report landing checklist, badge transition source-of-truth, findings tracker policy, and log requirements.
- Added `audits/audit-sow-summary.md` for confidential or not-yet-publishable SOW handling without committing firm-private terms.
- Added `scripts/audit-handoff.sh` with strict default artifact validation, `--allow-missing` preflight support for concurrent Epic 5 root-story PRs, tarball output, and manifest output.
- Added `scripts/check-audit-report-citations.sh` enforcing required NFR-S1 report citations.
- Added fixture-based ATDD coverage for handoff tarball contents and citation-check positive/negative behavior.
- Addressed test-review maintainability and determinism feedback by splitting the Story 5.8 tests and using deterministic scratch paths under `tests/.tmp/`.

### File List

- `.gitignore`
- `audits/README.md`
- `audits/audit-sow-summary.md`
- `output_susu/implementation-artifacts/5-8-audit-engagement.md`
- `output_susu/test-artifacts/atdd-checklist-5-8-audit-engagement.md`
- `output_susu/test-artifacts/test-reviews/story-5-8-test-review.md`
- `scripts/audit-handoff.sh`
- `scripts/check-audit-report-citations.sh`
- `tests/atdd/story-5-8-audit-engagement.atdd.md`
- `tests/atdd/story-5-8-audit-engagement.scripts.red.test.mjs`
- `tests/atdd/story-5-8-audit-engagement.static.red.test.mjs`
- `tests/fixtures/audit-handoff-complete/IDL_FREEZE.md`
- `tests/fixtures/audit-handoff-complete/audits/adversary/adversary-report.json`
- `tests/fixtures/audit-handoff-complete/docs/collateral-curve.md`
- `tests/fixtures/audit-handoff-complete/docs/fincen-cvc-framing.md`
- `tests/fixtures/audit-handoff-complete/docs/threat-model.md`
- `tests/fixtures/audit-handoff-complete/output_susu/planning-artifacts/architecture.md`
- `tests/fixtures/audit-handoff-complete/programs/susu/idl/susu.json`
- `tests/fixtures/audit-handoff-complete/tests/coverage/threat-model.md`
- `tests/fixtures/audit-handoff-complete/tests/invariants/no_strategic_default.rs`

### Change Log

- 2026-05-08: Added ATDD artifacts for Story 5.8 audit engagement workflow.
- 2026-05-08: Implemented audit engagement docs, handoff tooling, citation check, fixtures, and validation record.
- 2026-05-08: Addressed BMad test-review findings for maintainability and deterministic scratch output.
