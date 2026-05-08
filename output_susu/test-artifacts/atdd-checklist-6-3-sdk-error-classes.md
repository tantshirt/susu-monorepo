---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-09'
storyId: '6.3'
storyKey: 6-3-sdk-error-classes
storyFile: output_susu/implementation-artifacts/6-3-sdk-error-classes.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-3-sdk-error-classes.md
generatedTestFiles:
  - tests/atdd/story-6-3-sdk-error-classes.atdd.md
  - tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/6-3-sdk-error-classes.md
  - output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md
  - sdk/ts/src/errors.ts
  - sdk/ts/src/lib/executeTx.ts
  - sdk/ts/src/generated/errors/SusuError.ts
---

# ATDD Checklist: Story 6.3 SDK Error Classes

## TDD Red Phase

Red-phase acceptance scaffolds were generated from Story 6.3 acceptance criteria and the existing Story 6.2 SDK transaction path.

- BDD scenarios: `tests/atdd/story-6-3-sdk-error-classes.atdd.md`
- Static red test: `tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs`
- Story handoff: `output_susu/implementation-artifacts/6-3-sdk-error-classes.md`

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 typed error instances | Static checks require program, simulation, RPC, and cluster classes under one `SusuErrorBase` union and public exports. |
| AC2 typed fields | Static checks require discriminated `kind` values and unit coverage for program `code`/`name`, simulation logs, and RPC context. |
| AC3 no bare SDK throws | Static checks scan `sdk/ts/src` transaction and helper sources for `throw new Error(...)` and string rejections. |
| AC4 unit coverage | Static checks require `sdk/ts/tests/errors.test.ts` coverage for Anchor decode, non-Anchor simulation failure, RPC timeout, and kind narrowing. |
| AC5 docs | Static checks require `docs/sdk-typescript.md` taxonomy, `switch (err.kind)` examples, and recovery hints. |

## Red-Green Activation

The repository's ATDD convention uses active `node --test` static red tests. This Story 6.3 test should fail before implementation because the current SDK has only Story 6.2 cluster/simulation errors and does not decode Anchor errors or wrap RPC transport failures.

Run:

```sh
node --test tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs
pnpm test:atdd
```

## Implementation Guidance

- Keep imports kit-first; do not add direct `@solana/web3.js` imports to `sdk/ts/src`.
- Prefer generated `sdk/ts/src/generated/errors/SusuError.ts`; if numeric codes are unavailable there, create an IDL-sourced map in `sdk/ts/src/lib/programErrors.ts`.
- Keep `kind` as the canonical discriminator even when `instanceof` also works.
- Preserve simulation logs verbatim and attach decoded program errors through `cause`.

## Validation

- Prerequisites satisfied: Story ACs are explicit, Vitest exists under `sdk/ts/tests`, and the repo has an active Node ATDD harness.
- Generation mode: sequential AI generation using the repo's static red-test convention.
- CLI sessions cleaned up: yes.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: Story 6.3 implementation.
