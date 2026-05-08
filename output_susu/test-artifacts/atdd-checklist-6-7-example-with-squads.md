---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-09'
storyId: '6.7'
storyKey: 6-7-example-with-squads
storyFile: output_susu/implementation-artifacts/6-7-example-with-squads.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-7-example-with-squads.md
generatedTestFiles:
  - tests/atdd/story-6-7-example-with-squads.atdd.md
  - tests/atdd/story-6-7-example-with-squads.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-7-example-with-squads.md
  - output_susu/planning-artifacts/epics.md
  - sdk/ts/src/client.ts
  - sdk/ts/src/helpers/createGroup.ts
---

# ATDD Checklist: Story 6.7 examples/with-squads

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.7 acceptance criteria and the current SDK transaction hook surface.

- BDD scenarios: `tests/atdd/story-6-7-example-with-squads.atdd.md`
- Static red test: `tests/atdd/story-6-7-example-with-squads.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-7-example-with-squads.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 Squads as Group Creator | Static checks require `createSusuClient`, `createGroup`, Squads proposal calls, and creator verification against the multisig signer address. |
| AC2 independent, small example | Static checks require package scripts, env file, README, required dependencies, no cross-example imports, and <=200 non-empty source LOC. |
| AC3 happy-path tests | Static checks require unit and gated e2e tests covering proposal approvals and multisig-as-creator verification. |
| AC4 governance trade-offs | Static checks require README coverage for latency, recovery, censorship, threshold sizing, and mainnet considerations. |

## Red-Green Activation

Run:

```sh
node --test tests/atdd/story-6-7-example-with-squads.static.red.test.mjs
pnpm --filter @susu-examples/with-squads test
PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-squads test
```

## Implementation Guidance

- Keep source kit-first and avoid direct `@solana/web3.js` imports.
- Treat Squads as a governance proposal layer, not a single-key signer.
- Use the multisig PDA as Susu `creator`; member keys approve and execute through Squads.
- Keep live-network concerns explicit in the README and default the runnable example to a local dry-run gateway.

## Validation

- Prerequisites satisfied: Stories 6.1-6.3 expose the Susu SDK fluent client, transaction hook, and typed errors needed by the example.
- Generation mode: sequential AI generation using the repo's static red-test convention.
- CLI sessions cleaned up: yes.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: Story 6.7 implementation.
