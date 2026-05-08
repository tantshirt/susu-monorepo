---
stepsCompleted:
  - step-01-gather-context
  - step-02-review
  - step-03-triage
  - step-04-present
lastStep: step-04-present
lastSaved: '2026-05-08'
storyId: '6.1'
storyKey: 6-1-ts-sdk-fluent-client
reviewMode: full
diffBase: origin/main
inputDocuments:
  - output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md
  - output_susu/test-artifacts/atdd-checklist-6-1-ts-sdk-fluent-client.md
  - output_susu/test-artifacts/test-reviews/story-6-1-test-review.md
---

# Code Review: Story 6.1 `@susu/sdk` Fluent Client

## Scope

Reviewed the branch diff against `origin/main`:

- `sdk/ts/src/client.ts`
- `sdk/ts/src/helpers/**`
- `sdk/ts/src/index.ts`
- `sdk/ts/package.json`
- `sdk/ts/README.md`
- Story 6.1 unit tests and ATDD/static tests
- Story/test artifacts under `output_susu/**`

## Layer Results

| Layer | Result | Notes |
| --- | --- | --- |
| Blind Hunter | Clean | No diff-only correctness blockers found. |
| Edge Case Hunter | Clean | Client config errors, mocked RPC dispatch, compute-budget override path, read-helper pagination, and generated-file boundary reviewed. |
| Acceptance Auditor | Clean | AC1-AC6 satisfied; generated builders/decoders are used and no direct `@solana/web3.js` imports were introduced in `sdk/ts/src/`. |

## Findings

No blocking, high, medium, or low-severity findings remain.

Cursor Bugbot reported two issues on PR #177 commit `c9b1152cb60e75bcabee0f7eb7f6f5314ab8c954`; both were fixed during recovery:

- Corrected `queryHistory(..., { before })` to return entries before the cursor instead of after it.
- Removed the unused exported `prependComputeBudgetInstructions` helper while keeping compute-budget prepending inside `sendInstructions`.

Cursor Bugbot reported one issue on PR #177 commit `cd85ce6194a88cc4cb87b25c552429c78268309f`; it was fixed during the second recovery pass:

- Changed the `queryHistory` limit check to treat `limit: 0` as an empty page instead of falling through to no-limit behavior.

Cursor Bugbot reported one issue on PR #177 commit `7346b15b8f1876b3325f17ac3156befbf209425c`; it was fixed during the third recovery pass:

- Changed priority-fee/send hook detection to require explicit own RPC methods, so standard `@solana/kit` RPC proxies cannot bypass `SusuTransactionSendError` with generated method wrappers.

Cursor Bugbot reported one issue on PR #177 commit `0dd76829d315c764aca392e2180eae521a86dd21`; it was fixed during the fourth recovery pass:

- Moved `@solana-program/compute-budget` from peer/dev dependency declarations to a direct SDK runtime dependency because it is imported internally by `client.ts` and is not part of the consumer peer contract.

## Validation Evidence

- `git diff --check` passed.
- `pnpm install --frozen-lockfile` passed.
- `pnpm --filter @susu/sdk build` passed.
- `pnpm --filter @susu/sdk test` passed: 20 passed, 1 todo.
- `pnpm test:atdd` passed: 151 tests.
- `bash scripts/check-patterns.sh` passed.
- `bash scripts/check-sdk-parity.sh` passed and did not modify generated files.
- `node --input-type=module -e "const sdk = await import('./sdk/ts/dist/index.js'); ..."` verified the built package exports `createSusuClient`, `contribute`, `getGroup`, and `queries`.
- Recovery rerun after Cursor fixes passed `git diff --check`, `pnpm --filter @susu/sdk build`, `pnpm --filter @susu/sdk test`, `pnpm test:atdd`, `bash scripts/check-patterns.sh`, and `bash scripts/check-sdk-parity.sh`.
- Second recovery rerun after the zero-limit fix passed `git diff --check`, `pnpm --filter @susu/sdk build`, `pnpm --filter @susu/sdk test`, `pnpm test:atdd`, `bash scripts/check-patterns.sh`, and `bash scripts/check-sdk-parity.sh`.
- Third recovery rerun after the proxy send-hook fix passed `git diff --check`, `pnpm --filter @susu/sdk build`, `pnpm --filter @susu/sdk test`, `pnpm test:atdd`, `bash scripts/check-patterns.sh`, and `bash scripts/check-sdk-parity.sh`.
- Fourth recovery rerun after the dependency-classification fix passed `git diff --check`, `pnpm install --frozen-lockfile`, `pnpm --filter @susu/sdk build`, `pnpm --filter @susu/sdk test`, `pnpm test:atdd`, `bash scripts/check-patterns.sh`, and `bash scripts/check-sdk-parity.sh`.

## Outcome

Clean code review after recovery fixes. Proceed to final PR CI, Cursor Bugbot, and BAD status gates.
