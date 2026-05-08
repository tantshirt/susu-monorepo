---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '6.1'
storyKey: 6-1-ts-sdk-fluent-client
storyFile: output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-1-ts-sdk-fluent-client.md
generatedTestFiles:
  - tests/atdd/story-6-1-ts-sdk-fluent-client.atdd.md
  - tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md
  - sdk/ts/src/generated/index.ts
  - sdk/ts/src/generated/instructions/index.ts
  - sdk/ts/src/generated/accounts/index.ts
---

# ATDD Checklist: Story 6.1 `@susu/sdk` Fluent TS Client

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.1 acceptance criteria and the existing SDK/Codama surface.

- BDD scenarios: `tests/atdd/story-6-1-ts-sdk-fluent-client.atdd.md`
- Static red test: `tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 fluent client | Static checks require `createSusuClient`, `.use(plugin)`, signer/RPC plugins, and state containing `cluster`, `rpc`, `signer`, and `programId`. |
| AC2 typed helper bags | Static checks require all public helper files and package exports; unit tests must exercise typed argument bags with mocked RPC. |
| AC3 generated builders/decoders | Static checks require state helpers to import matching generated instruction builders and read helpers to use generated account/query decoders. |
| AC4 JSDoc examples | Static checks require kit-first `@example` blocks on every helper. |
| AC5 mocked RPC unit tests | Implementation phase must add Vitest tests under `sdk/ts/tests/` covering every helper against mocked RPC. |
| AC6 compute budget defaults | Static checks require compute-unit limit/price builders, default `200_000`, Helius `getPriorityFeeEstimate`, and `{ computeUnits, priorityFee }` overrides. |

## Red-Green Activation

The repository’s ATDD convention uses active `node --test` static red tests. This Story 6.1 test should fail before implementation because `client.ts`, helper files, README, and package export metadata do not yet exist.

Run:

```sh
node --test tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs
pnpm test:atdd
```

## Implementation Guidance

- Keep `sdk/ts/src/generated/` read-only and route helper construction through generated builders/decoders only.
- Keep SDK source kit-first: no direct `@solana/web3.js` imports in `sdk/ts/src/`.
- Use mocked RPC in Vitest tests; no cluster dependency belongs in Story 6.1 unit coverage.
- Keep `simulate?: boolean` and explicit cluster hooks plumbed but unenforced; Story 6.2 owns stricter behavior.

## Validation

- Prerequisites satisfied: Story ACs are explicit, generated SDK stubs exist, Vitest and Node ATDD harness exist.
- Generation mode: sequential AI generation using the repo’s static red-test convention.
- CLI sessions cleaned up: N/A, no browser automation used.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: `bmad-dev-story` for Story 6.1 implementation.
