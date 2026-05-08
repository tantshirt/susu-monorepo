---
stepsCompleted:
  - step-01-gather-context
  - step-02-review
  - step-03-triage
  - step-04-present
lastStep: step-04-present
lastSaved: '2026-05-09'
storyId: '6.3'
storyKey: 6-3-sdk-error-classes
reviewMode: full
diffBase: origin/main
inputDocuments:
  - output_susu/implementation-artifacts/6-3-sdk-error-classes.md
  - output_susu/test-artifacts/atdd-checklist-6-3-sdk-error-classes.md
  - output_susu/test-artifacts/test-reviews/story-6-3-test-review.md
---

# Code Review: Story 6.3 SDK Error Classes

## Scope

Reviewed the branch diff against `origin/main`:

- `sdk/ts/src/errors.ts`
- `sdk/ts/src/lib/executeTx.ts`
- `sdk/ts/src/lib/programErrors.ts`
- `sdk/ts/src/client.ts`
- `sdk/ts/src/index.ts`
- `sdk/ts/tests/errors.test.ts`
- `sdk/ts/tests/simulate.test.ts`
- `docs/sdk-typescript.md`
- Story/test artifacts under `output_susu/**`

## Layer Results

| Layer | Result | Notes |
| --- | --- | --- |
| Blind Hunter | Fixed | Cursor found duplicated RPC metadata helpers; they are now centralized in `sdk/ts/src/lib/rpcErrors.ts`. |
| Edge Case Hunter | Fixed | Cursor found a programLogs-only diagnostic gap and redundant regex fallback; both are fixed, and coverage now locks programLogs preservation. |
| Acceptance Auditor | Clean | AC1-AC5 satisfied: typed classes, typed fields, no bare SDK throws, unit coverage, and docs with `switch (err.kind)`. |

## Findings

No blocking, high, medium, or low-severity findings remain.

Cursor Bugbot findings fixed during PR gate:

- Medium: duplicated `extractRpcEndpoint`, `extractRpcStatus`, and `asRecord` helpers in `client.ts` and `executeTx.ts`; fixed by adding shared `sdk/ts/src/lib/rpcErrors.ts`.
- Medium: decoded program errors used empty `logs` for `simulationLogs` when decoding from non-empty `programLogs`; fixed by preserving the logs actually used for decode and adding unit coverage.
- Low: redundant exported `lookupSusuProgramError`; fixed by keeping it module-private and exporting only `decodeSusuProgramError`.
- Low: unreachable Anchor `ErrorNumber` regex fallback; fixed by using one `Error\s*Number` regex with a short clarifying comment.

## Validation Evidence

- `pnpm --dir sdk/ts build` passed.
- `pnpm --dir sdk/ts test` passed after Cursor follow-up fixes: 6 files passed, 1 skipped; 35 tests passed, 1 todo.
- `node --test tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs` passed.
- `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs` passed.
- `pnpm test:atdd` passed: 159 tests.
- `bash scripts/check-patterns.sh` passed.
- `bash scripts/check-sdk-parity.sh` passed and did not modify generated files.
- `pnpm exec tsx scripts/check-i18n-parity.ts` passed.
- `pnpm test --if-present` passed.
- `git diff --check` passed.
- Source grep for `throw new Error(...)` and string `Promise.reject(...)` in `sdk/ts/src` returned no matches.

## Outcome

Clean code review. Proceed to PR, CI, Cursor Bugbot, and BAD final status gates.
