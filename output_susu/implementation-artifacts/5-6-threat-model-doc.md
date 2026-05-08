# Story 5.6: Threat Model Doc and Traceability Matrix

Status: ready-for-dev

## Story

As an auditor, I want `docs/threat-model.md` enumerating adversary models, attack surfaces, and mitigations, plus a `tests/coverage/threat-model.md` traceability matrix mapping each documented attack to a specific test file, so that every claimed mitigation has a verifiable test artifact.

## Acceptance Criteria

1. Given the program from Epics 2-4, when the threat-model docs land, then `docs/threat-model.md` enumerates at least: strategic-default (curve), late-position cartel (30%-Cartel scenario), DoS via permissionless claim, malicious PDA collision, untrusted on-chain data deserialization, custodial path inadvertent introduction, scheduler/keeper introduction.
2. For each adversary, the doc states the attack vector, the mitigation, and the residual risk.
3. `tests/coverage/threat-model.md` is a markdown table with columns: `attack`, `mitigation`, `test_file_path`.
4. Every documented attack has at least one test file referenced.
5. Every test file referenced exists at the cited path.
6. The doc lists the immutability gate as both a security feature and a constraint (no hotfixes).

## Tasks / Subtasks

- [ ] Create Story 5.6 ATDD/static coverage guard.
- [ ] Expand `docs/threat-model.md` with required adversary models, mitigations, and residual risks.
- [ ] Replace `tests/coverage/threat-model.md` with a traceability table using the required columns.
- [ ] Verify every cited path in the coverage matrix exists.
- [ ] Run story-local and repository checks.
- [ ] Complete review follow-ups.

## Dev Notes

### Scope

- Owned files: `docs/threat-model.md`, `tests/coverage/threat-model.md`, Story 5.6 test artifacts, and the `5-6-threat-model-doc` sprint-status key at final completion.
- Keep public claims bounded to existing evidence. Where Epic 5 follow-on artifacts are not yet present, record the residual risk instead of citing missing paths.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-6-threat-model-doc.md`
- Static acceptance test: `tests/atdd/story-5-6-threat-model-doc.static.red.test.mjs`

## Dev Agent Record

### Debug Log

- Created from GitHub issue #49 because the sprint-status key existed but the story file was missing from this checkout.

### Completion Notes

- Pending implementation.

### File List

- `output_susu/implementation-artifacts/5-6-threat-model-doc.md`
- `output_susu/test-artifacts/atdd-checklist-5-6-threat-model-doc.md`
- `tests/atdd/story-5-6-threat-model-doc.static.red.test.mjs`
- `docs/threat-model.md`
- `tests/coverage/threat-model.md`

### Change Log

- 2026-05-08: Initialized Story 5.6 from issue #49.
