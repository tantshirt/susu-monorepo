# Story 6.8 Test Review

Date: 2026-05-09
Story: 6.8 `examples/with-token-extensions`

## Scope

- `tests/atdd/story-6-8-example-with-token-extensions.static.red.test.mjs`
- `examples/with-token-extensions/tests/mintSetup.test.ts`
- `examples/with-token-extensions/tests/e2e.test.ts`
- `examples/with-token-extensions/src/*.ts`
- `examples/with-token-extensions/README.md`

## Findings

1. Initial implementation exceeded the 200-line source gate at 224 lines. Fixed by tightening imports and type declarations.
2. Example build depended on `@susu/sdk` `dist/` being present. Fixed with package lifecycle hooks that build the local SDK before start/build/test.
3. Vitest discovered compiled tests under `dist/` after `build`. Fixed by excluding `dist/**` from the test script.
4. Initial happy path covered only one member. Fixed by minting mock supply to three generated member token accounts and running collateral + contribution for all three.

## Validation Evidence

- `node --test tests/atdd/story-6-8-example-with-token-extensions.static.red.test.mjs` passed.
- `pnpm --filter @susu-examples/with-token-extensions build` passed.
- `pnpm --filter @susu-examples/with-token-extensions test` passed: 4 passed, 1 skipped.
- `PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-token-extensions test:e2e` passed: 1 passed.
- `pnpm --filter @susu-examples/with-token-extensions start` passed and printed the Token-2022 mint, all three extensions, hook PDA, Permanent Delegate check, and nine mock signatures.

## Result

Test review passed after fixes.

## Residual Risk

- The e2e path exercises the SDK's mockable send hook rather than submitting funded devnet transactions. This matches current SDK capabilities and keeps the example runnable from a clean checkout.
