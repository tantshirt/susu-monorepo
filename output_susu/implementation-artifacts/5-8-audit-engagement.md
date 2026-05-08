# Story 5.8: Audit firm engagement + report linking (FR57, NFR-S1)

Status: ready-for-dev

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

- [ ] Draft `audits/README.md` index (AC: 1)
  - [ ] `# Audits` H1
  - [ ] `## Engagement Status` table with columns: `Firm`, `Scope`, `Engagement Date`, `Expected Delivery`, `Status`, `Report Path`
  - [ ] One row for the primary audit engagement
  - [ ] `## Reproduction & Verification` points to adversary, invariant, threat-model, curve, and FinCEN artifacts
  - [ ] `## Findings Tracker` documents public issue-label handling
- [ ] Day-1 deliverable bundle (AC: 3)
  - [ ] Create `scripts/audit-handoff.sh`
  - [ ] Bundle frozen IDL commit/IDL JSON, invariant test, adversary report, threat model, coverage matrix, curve doc, FinCEN framing, and architecture doc
  - [ ] Write `audits/handoff-YYYY-MM-DD.tar.gz` and keep it gitignored
  - [ ] Include a bundle manifest for audit handoff review
- [ ] SOW handling (AC: 2)
  - [ ] If sharable, commit `audits/audit-sow.pdf`
  - [ ] If confidential or not yet publishable, commit `audits/audit-sow-summary.md`
  - [ ] Reference the selected SOW artifact from `audits/README.md`
- [ ] Report landing scaffolding (AC: 4)
  - [ ] Document report commit recipe at `audits/{firm-slug}-{YYYY-MM}.pdf`
  - [ ] Add `scripts/check-audit-report-citations.sh` enforcing the two NFR-S1 path citations
  - [ ] Cover positive and negative citation-check behavior with a static ATDD test
- [ ] README badge transition workflow (AC: 5)
  - [ ] Add TODO in `audits/README.md` for Epic 8 badge wiring
  - [ ] Do not edit root `README.md` in this story
- [ ] Findings tracker setup (AC: 6)
  - [ ] Create or verify GitHub labels `audit-finding` and `audit-finding-resolved`
  - [ ] Document mitigation status workflow in `audits/README.md`
- [ ] Daily-log entry guidance
  - [ ] Document Day-1 handoff and report-delivery log requirements

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
- Story handoff path: `output_susu/implementation-artifacts/5-8-audit-engagement.md`

## Dev Agent Record

### Agent Model Used

_TBD_

### Debug Log References

### Completion Notes List

### File List
