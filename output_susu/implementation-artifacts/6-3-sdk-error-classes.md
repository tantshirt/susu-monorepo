# Story 6.3: SDK error classes — typed discriminated union

Status: ready-for-dev

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

- [ ] Define typed discriminated union in `sdk/ts/src/errors.ts` (AC: 1, 2)
  - [ ] `abstract class SusuErrorBase extends Error { abstract kind: 'program' | 'simulation' | 'rpc' | 'cluster' }`
  - [ ] `class SusuError extends SusuErrorBase { kind: 'program'; code: number; name: string; instructionName?: string; }` — decoded from Anchor's `SusuError` enum (sourced from generated `errors/` map)
  - [ ] `class SusuSimulationError extends SusuErrorBase { kind: 'simulation'; logs: string[]; programLogs: string[]; cause?: SusuError | unknown; }`
  - [ ] `class SusuRpcError extends SusuErrorBase { kind: 'rpc'; status?: number; endpoint?: string; cause?: unknown; }`
  - [ ] `class SusuClusterError extends SusuErrorBase { kind: 'cluster'; expected: string; actual: string; }` (carried over from 6.2)
  - [ ] Type-narrowing helper: `isSusuError(e): e is SusuErrorBase` and per-kind guards (`isSusuProgramError`, etc.)
- [ ] Decode Anchor program errors in `executeTx` (AC: 1, 3)
  - [ ] On simulation failure, parse logs for `Program log: AnchorError ... ErrorNumber: N` and map to `SusuError` via the Codama-generated error map
  - [ ] If decode succeeds: throw `SusuSimulationError({ logs, programLogs, cause: new SusuError(...) })`
  - [ ] If decode fails: throw `SusuSimulationError` with `cause: undefined`
  - [ ] On RPC connectivity errors (timeout, 5xx, network): wrap in `SusuRpcError`
- [ ] Audit all helpers and `executeTx` for bare throws (AC: 3)
  - [ ] Replace any `throw new Error(...)` or `Promise.reject('...')` with the appropriate typed class
  - [ ] Add CI grep check (Story 6.5 / 6.11) for `throw new Error\(` inside `sdk/ts/src/`
- [ ] Unit tests at `sdk/ts/tests/errors.test.ts` (AC: 4)
  - [ ] Synthetic Anchor error log → decoded `SusuError` with correct `code` + `name`
  - [ ] Simulation failure with non-Anchor log → `SusuSimulationError` with `cause: undefined`
  - [ ] Mock RPC timeout → `SusuRpcError`
  - [ ] Type-narrowing via discriminated `kind` works for TS pattern match
- [ ] Document error taxonomy in `docs/sdk-typescript.md` (AC: 5)
  - [ ] Full class hierarchy + fields
  - [ ] Pattern-matching example (`switch (err.kind)`)
  - [ ] Recovery-hint table per error kind

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

_TBD_

### Debug Log References

### Completion Notes List

### File List
