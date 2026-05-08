# Story 6.3: SDK error classes — typed discriminated union

Status: done

## Story

As an integrator,
I want `SusuError`, `SusuSimulationError`, `SusuRpcError` typed error classes that I can pattern-match on,
so that I can build robust error UX without `instanceof Error` guards on bare strings.

## Acceptance Criteria

1. **Given** the SDK helpers from Stories 6.1–6.2, **when** an error path fires, **then** it throws an instance of `SusuError` (program-level errors decoded from Anchor `SusuError` enum), `SusuSimulationError` (simulation reported failure), or `SusuRpcError` (RPC connectivity / timeout).
2. Every error class extends `Error` and adds typed fields (`code`, `instructionName`, `simulationLogs` where applicable).
3. The SDK never throws a bare `Error` or rejects with a string.
4. Unit tests cover the error-class branching for each error type.
5. The classes are documented in `docs/sdk-typescript.md`.

## Tasks / Subtasks

- [x] Define typed discriminated union in `sdk/ts/src/errors.ts` (AC: 1, 2)
  - [x] `abstract class SusuErrorBase extends Error { abstract kind: 'program' | 'simulation' | 'rpc' | 'cluster' }`
  - [x] `class SusuError extends SusuErrorBase { kind: 'program'; code: number; name: string; instructionName?: string; }` — decoded from Anchor's `SusuError` enum (sourced from generated `errors/` map)
  - [x] `class SusuSimulationError extends SusuErrorBase { kind: 'simulation'; logs: string[]; programLogs: string[]; cause?: SusuError | unknown; }`
  - [x] `class SusuRpcError extends SusuErrorBase { kind: 'rpc'; status?: number; endpoint?: string; cause?: unknown; }`
  - [x] `class SusuClusterError extends SusuErrorBase { kind: 'cluster'; expected: string; actual: string; }` (carried over from 6.2)
  - [x] Type-narrowing helper: `isSusuError(e): e is SusuErrorBase` and per-kind guards (`isSusuProgramError`, etc.)
- [x] Decode Anchor program errors in `executeTx` (AC: 1, 3)
  - [x] On simulation failure, parse logs for `Program log: AnchorError ... ErrorNumber: N` and map to `SusuError` via the Codama-generated error map
  - [x] If decode succeeds: throw `SusuSimulationError({ logs, programLogs, cause: new SusuError(...) })`
  - [x] If decode fails: throw `SusuSimulationError` with `cause: undefined`
  - [x] On RPC connectivity errors (timeout, 5xx, network): wrap in `SusuRpcError`
- [x] Audit all helpers and `executeTx` for bare throws (AC: 3)
  - [x] Replace any `throw new Error(...)` or `Promise.reject('...')` with the appropriate typed class
  - [x] Add CI grep check (Story 6.5 / 6.11) for `throw new Error\(` inside `sdk/ts/src/`
- [x] Unit tests at `sdk/ts/tests/errors.test.ts` (AC: 4)
  - [x] Synthetic Anchor error log → decoded `SusuError` with correct `code` + `name`
  - [x] Simulation failure with non-Anchor log → `SusuSimulationError` with `cause: undefined`
  - [x] Mock RPC timeout → `SusuRpcError`
  - [x] Type-narrowing via discriminated `kind` works for TS pattern match
- [x] Document error taxonomy in `docs/sdk-typescript.md` (AC: 5)
  - [x] Full class hierarchy + fields
  - [x] Pattern-matching example (`switch (err.kind)`)
  - [x] Recovery-hint table per error kind

## Dev Notes

### Architecture compliance (non-negotiables)

- **Discriminated-union via `kind` field is the architecture decision (ARCH-42).** Pattern matching is `switch (err.kind)`, not `instanceof`. The `instanceof` checks still work, but `kind` is the canonical discriminator.
- **Anchor program errors are decoded, not surfaced raw.** The Codama-generated `sdk/ts/src/generated/errors/` (or equivalent) carries the `SusuError` enum mapping (number → name). The SDK looks up the number from logs and constructs a typed `SusuError`. If Codama doesn't generate this map, hand-author a small mapper at `sdk/ts/src/lib/programErrors.ts` sourced from the IDL — but flag this in `log/` daily entry.
- **No bare `Error` throws or string rejections anywhere in the SDK.** This is structurally enforced by CI lint after this story.
- **Errors carry context, not blame.** Field names are `logs`, `programLogs`, `code`, `name`, `instructionName` — not `errorMessage`, `description`, `humanReadable`. Integrators decide UX presentation; SDK provides typed data.

### Source tree (this story creates/modifies)

```
sdk/ts/src/
├── errors.ts                     # MODIFY — full taxonomy
├── lib/
│   ├── executeTx.ts              # MODIFY — typed error decoding
│   └── programErrors.ts          # CREATE if Codama doesn't generate error map
└── index.ts                      # MODIFY — re-export error classes + guards

sdk/ts/tests/
└── errors.test.ts                # CREATE

docs/
└── sdk-typescript.md             # MODIFY — error taxonomy section
```

### Project Structure Notes

- Depends on Story 6.2 (`errors.ts` stub + `executeTx`) and Story 1.3 (Codama error map). No IDL re-freeze — adding error classes is SDK-only, program/IDL unchanged.
- The error map in `programErrors.ts` (if hand-authored) reads from IDL-derived constants; if the IDL changes (re-freeze in another story), this map must be regenerated or hand-updated. Add a TODO that automates this in a follow-up.

### Forbidden patterns

- `throw new Error(...)` inside `sdk/ts/src/` — use typed classes.
- `Promise.reject('string literal')` — use typed classes.
- Stringly-typed error checks (`if (e.message.includes('...'))`) — use `e.kind` + `e.code`.
- Editing `sdk/ts/src/generated/` (still forbidden from 6.1).

### Testing standards

- Vitest. New file `errors.test.ts` covers each kind. Add a test that asserts no public helper throws a bare `Error` (use a mocked RPC failure path and assert `error instanceof SusuErrorBase`).
- TypeScript strict mode: type-narrowing via `kind` discriminator must compile without `as` casts.

### References

- [epics.md §Epic 6 / Story 6.3](../planning-artifacts/epics.md) — BDD ACs
- [architecture.md §Core Architectural Decisions ARCH-42](../planning-artifacts/architecture.md) — discriminated-union error model
- [Story 6.1](6-1-ts-sdk-fluent-client.md), [Story 6.2](6-2-sdk-simulate-cluster-gate.md) — baseline + simulation/cluster errors
- [prd.md §FR31, §FR34](../planning-artifacts/prd.md) — SDK error surface implied

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `log/2026-05-09.md`
- `output_susu/test-artifacts/atdd-checklist-6-3-sdk-error-classes.md`
- `output_susu/test-artifacts/test-reviews/story-6-3-test-review.md`
- `output_susu/test-artifacts/code-reviews/story-6-3-code-review.md`

### Completion Notes List

- Added `SusuErrorBase`, program/simulation/RPC/cluster subclasses, `SusuSdkError` union, and public type guards.
- Added IDL-sourced `sdk/ts/src/lib/programErrors.ts` fallback because the generated TypeScript enum has names but no numeric code map.
- Updated `executeTx` to decode Anchor program errors from simulation logs, preserve diagnostic logs, and wrap RPC transport/config failures in `SusuRpcError`.
- Removed bare `throw new Error(...)` paths from `sdk/ts/src`, documented `switch (err.kind)`, and added Story 6.3 ATDD/unit coverage.
- Addressed Cursor Bugbot findings on PR #179; latest `lint-and-build` and Cursor Bugbot checks passed on commit `51f6cf40b58ccb44d96ffa863ab081a7a6e92efa`.

### File List

- `docs/sdk-typescript.md`
- `log/2026-05-09.md`
- `output_susu/implementation-artifacts/6-3-sdk-error-classes.md`
- `output_susu/implementation-artifacts/sprint-status.yaml`
- `output_susu/test-artifacts/atdd-checklist-6-3-sdk-error-classes.md`
- `output_susu/test-artifacts/code-reviews/story-6-3-code-review.md`
- `output_susu/test-artifacts/test-reviews/story-6-3-test-review.md`
- `scripts/check-patterns.sh`
- `sdk/ts/src/client.ts`
- `sdk/ts/src/errors.ts`
- `sdk/ts/src/index.ts`
- `sdk/ts/src/lib/executeTx.ts`
- `sdk/ts/src/lib/programErrors.ts`
- `sdk/ts/src/lib/rpcErrors.ts`
- `sdk/ts/tests/errors.test.ts`
- `sdk/ts/tests/simulate.test.ts`
- `tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs`
- `tests/atdd/story-6-3-sdk-error-classes.atdd.md`
- `tests/atdd/story-6-3-sdk-error-classes.static.red.test.mjs`
