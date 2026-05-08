# Code Review: Story 6.8 Token-2022 Example

Date: 2026-05-09
Story: 6.8 `examples/with-token-extensions`

## Scope

Reviewed the branch diff against `origin/main`:

- `examples/with-token-extensions/**`
- `tests/atdd/story-6-8-example-with-token-extensions.static.red.test.mjs`
- `pnpm-lock.yaml`
- Story 6.8 evidence artifacts under `output_susu/test-artifacts/**`

## Layer Results

| Layer | Result | Notes |
| --- | --- | --- |
| Blind Hunter | Clean | Package, source, tests, and README match the requested Story 6.8 surface. |
| Edge Case Hunter | Clean after fixes | Reviewed line cap, SDK dist bootstrap, dist test duplication, BigInt test serialization, and three-member happy path. |
| Acceptance Auditor | Clean | Transfer Hook, Metadata Pointer, Permanent Delegate, hook PDA threading, Permanent Delegate read-only check, v0.1/v2 README caveats, and gated e2e coverage are present. |

## Findings

Cursor Bugbot reported one high-severity issue on PR #180 commit `664520eeb19ce56c19e4dd915c5ca678204df09b`:

- `token2022TransferAccounts` returned `vault` and `contributor`, which covered `contribute`, but did not return the `collateralVault` and `payer` account names required by `postCollateral`.

Fixed by returning both account-name pairs and adding unit assertions for `payer`, `collateralVault`, `contributor`, and `vault`.

## Validation Evidence

- `git diff --check` passed.
- `pnpm install --frozen-lockfile` passed.
- `node --test tests/atdd/story-6-8-example-with-token-extensions.static.red.test.mjs` passed.
- `pnpm --filter @susu-examples/with-token-extensions build` passed.
- `pnpm --filter @susu-examples/with-token-extensions test` passed.
- `PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-token-extensions test:e2e` passed.
- `pnpm --filter @susu-examples/with-token-extensions start` passed.

## Outcome

Clean code review. Proceed to commit, PR CI, Cursor Bugbot evidence, and merge gates.
