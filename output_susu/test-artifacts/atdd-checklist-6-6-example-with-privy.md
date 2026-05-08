---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-09'
storyId: '6.6'
storyKey: 6-6-example-with-privy
storyFile: output_susu/implementation-artifacts/6-6-example-with-privy.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-6-example-with-privy.md
generatedTestFiles:
  - tests/atdd/story-6-6-example-with-privy.atdd.md
  - tests/atdd/story-6-6-example-with-privy.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-6-example-with-privy.md
  - output_susu/planning-artifacts/epics.md
  - output_susu/planning-artifacts/architecture.md
  - sdk/ts/src/client.ts
---

# ATDD Checklist: Story 6.6 Example With Privy

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.6 acceptance criteria and the existing Story 6.1-6.3 SDK transaction path.

- BDD scenarios: `tests/atdd/story-6-6-example-with-privy.atdd.md`
- Static red test: `tests/atdd/story-6-6-example-with-privy.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-6-example-with-privy.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 mini-ROSCA cycle | Static checks require the example to provision three Solana Privy wallets and call `createGroup`, `acceptInvite`, `postCollateral`, and `contribute`. |
| AC2 <=200 LOC | Static checks count nonblank lines under `examples/with-privy/src`. |
| AC3 README | Static checks require setup, env vars, run instructions, trade-offs, and see-also sections. |
| AC4 independent | Static checks reject `apps/reference`, cross-example imports, and direct `@solana/web3.js`. |
| AC5 tests | Static checks require mocked adapter unit tests and a gated e2e happy path. |

## Red-Green Activation

Run:

```sh
node --test tests/atdd/story-6-6-example-with-privy.static.red.test.mjs
pnpm test:atdd
```

The Story 6.6 static red test should fail before implementation because `examples/with-privy` only contains a placeholder `.gitkeep`.

## Implementation Guidance

- Use `@privy-io/node`, not deprecated `@privy-io/server-auth`, for the server-side Privy example.
- Keep the Susu SDK call path kit-first and do not import `@solana/web3.js`.
- Gate live e2e execution behind `PNPM_TEST_E2E=1`; default tests should use mocked Privy signing.
- Keep runtime credentials in `.env` only and document `.env.example`.
