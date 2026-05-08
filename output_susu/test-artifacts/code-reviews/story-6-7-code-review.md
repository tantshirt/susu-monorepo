---
stepsCompleted:
  - step-01-gather-context
  - step-02-review
  - step-03-triage
  - step-04-present
lastStep: step-04-present
lastSaved: '2026-05-09'
storyId: '6.7'
storyKey: 6-7-example-with-squads
reviewMode: full
diffBase: origin/main
inputDocuments:
  - output_susu/implementation-artifacts/6-7-example-with-squads.md
  - output_susu/test-artifacts/atdd-checklist-6-7-example-with-squads.md
  - output_susu/test-artifacts/test-reviews/story-6-7-test-review.md
---

# Code Review: Story 6.7 examples/with-squads

## Scope

Reviewed the branch diff against `origin/main`:

- `examples/with-squads/**`
- `tests/atdd/story-6-7-example-with-squads.*`
- `output_susu/test-artifacts/**/story-6-7-*`
- Story/status artifacts under `output_susu/implementation-artifacts/**`
- `pnpm-lock.yaml`

## Layer Results

| Layer | Result | Notes |
| --- | --- | --- |
| Blind Hunter | Fixed | Dry-run gateway execution initially trusted the signer adapter to collect enough approvals. It now enforces the stored multisig threshold before execution. |
| Edge Case Hunter | Clean | Existing multisig vs. generated multisig, proposal creation, threshold approval, execution, and creator verification are covered by the local happy path. |
| Acceptance Auditor | Clean | AC1-AC4 satisfied: independent runnable package, <=200 source LOC, own README with governance trade-offs, and unit/gated e2e happy-path tests. |

## Findings

No blocking, high, medium, or low-severity findings remain.

Resolved during review:

- Low: the dry-run Squads gateway could execute a proposal if called directly with insufficient approvals. Fixed by recording the multisig threshold during `ensureMultisig` and rejecting execution until `approvals.length >= threshold`.
- Medium: Cursor Bugbot noted Squads vault transactions sign inner instructions from the vault PDA, not the multisig account PDA. Fixed by using the vault PDA as `squadsSigner.address` and the Susu `creator`, while keeping the multisig PDA as the governance account that owns the vault.
- Low: Cursor Bugbot noted the approval status ternary was always true. Fixed by setting proposal status to `approved` unconditionally after adding the member approval.

## Validation Evidence

- `node --test tests/atdd/story-6-7-example-with-squads.static.red.test.mjs` passed.
- `pnpm --filter @susu-examples/with-squads build` passed.
- `pnpm --filter @susu-examples/with-squads test` passed.
- `PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-squads test` passed.
- `pnpm --filter @susu-examples/with-squads start` passed.
- `pnpm test:atdd` passed.
- `bash scripts/check-patterns.sh` passed.
- Source grep for `@solana/web3.js`, `apps/reference`, and cross-example imports in `examples/with-squads` returned no matches.

## Outcome

Clean code review. Proceed to PR, CI, Cursor Bugbot, and BAD final status gates.
