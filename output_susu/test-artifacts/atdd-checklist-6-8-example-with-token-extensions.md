# ATDD Checklist: Story 6.8 Token-2022 Example

Date: 2026-05-09
Story: 6.8 `examples/with-token-extensions`

## Acceptance Coverage

| AC | Coverage |
| --- | --- |
| Runnable package | `tests/atdd/story-6-8-example-with-token-extensions.static.red.test.mjs` asserts package scripts, workspace dependency, config files, and independent example layout. |
| Token-2022 mint extensions | Static ATDD and `examples/with-token-extensions/tests/mintSetup.test.ts` assert Transfer Hook, Metadata Pointer, Permanent Delegate, Token-2022 program, and mint instruction discriminators. |
| Susu composition | Unit and e2e tests assert `createSusuClient`, `postCollateral`, and `contribute` receive the Token-2022 program and hook extra-account PDA. |
| README scope | Static ATDD asserts v0.1.0 SPL Token boundary, mainnet-live May 2026 language, post-v2 confidential transfer language, and ZK ElGamal gate. |
| Happy path | `PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-token-extensions test:e2e` runs mint setup, mock member supply, group creation, collateral, and contribution flow. |

## Red Phase

- Initial ATDD run failed because `examples/with-token-extensions` only contained `.gitkeep`.

## Green Phase

- Implemented the package, README, mint setup helper, runnable demo, unit tests, and gated e2e test.
- Final focused ATDD passed.

## Residual Risk

- The example uses the repository's SDK mockable RPC hook so it is independently runnable without a funded devnet keypair. A live devnet transaction sender remains an integrator responsibility until the SDK exposes a production transaction assembly path.
