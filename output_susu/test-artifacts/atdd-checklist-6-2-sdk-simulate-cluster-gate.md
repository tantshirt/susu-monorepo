---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '6.2'
storyKey: 6-2-sdk-simulate-cluster-gate
storyFile: output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-2-sdk-simulate-cluster-gate.md
generatedTestFiles:
  - tests/atdd/story-6-2-sdk-simulate-cluster-gate.atdd.md
  - tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md
  - output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md
  - sdk/ts/src/client.ts
  - sdk/ts/src/helpers/internal/state.ts
---

# ATDD Checklist: Story 6.2 SDK Simulate + Cluster Gate

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.2 acceptance criteria and the existing Story 6.1 SDK helper surface.

- BDD scenarios: `tests/atdd/story-6-2-sdk-simulate-cluster-gate.atdd.md`
- Static red test: `tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 simulate option defaults true | Static checks require a shared `executeTx` helper with `options.simulate ?? true`; Vitest must cover the default path. |
| AC2 simulation failure typed logs | Static checks require `SusuSimulationError` with `logs` and `programLogs`; Vitest must assert no send occurs after a failed simulation. |
| AC3 explicit cluster + mainnet gate | Static checks require non-optional `cluster`, `SusuClusterError`, known endpoint checks, and genesis-hash heuristics. |
| AC4 unit coverage | Static checks require `client.test.ts` and `simulate.test.ts` to cover missing cluster, mainnet mismatch, explicit mainnet success, simulation success/failure, and `simulate: false`. |
| AC5 docs | Static checks require `docs/sdk-typescript.md` examples and failure recovery guidance. |

## Red-Green Activation

The repository's ATDD convention uses active `node --test` static red tests. This Story 6.2 test should fail before implementation because `errors.ts`, `lib/executeTx.ts`, `simulate.test.ts`, and `docs/sdk-typescript.md` do not exist yet and `cluster` is still optional.

Run:

```sh
node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs
pnpm test:atdd
```

## Implementation Guidance

- Keep the SDK source kit-first with no direct `@solana/web3.js` imports in `sdk/ts/src/`.
- Treat `simulate: false` as a per-call advanced escape hatch only; no global simulation disable should exist.
- Run the mainnet cluster gate before instruction building when the heuristic can resolve mainnet, so rejected helpers cannot build or send.
- Preserve simulation logs verbatim on `SusuSimulationError`.

## Validation

- Prerequisites satisfied: Story ACs are explicit, Vitest exists under `sdk/ts/tests`, and the repo has an active Node ATDD harness.
- Generation mode: sequential AI generation using the repo's static red-test convention.
- CLI sessions cleaned up: N/A, no browser automation used.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: `bmad-dev-story` for Story 6.2 implementation.
