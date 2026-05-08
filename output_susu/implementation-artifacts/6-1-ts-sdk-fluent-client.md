# Story 6.1: TS SDK (@susu/sdk) idiomatic helpers + fluent client

Status: review

## Story

As an integrator,
I want `@susu/sdk` to expose idiomatic TypeScript helpers (`createGroup`, `acceptInvite`, `postCollateral`, `contribute`, `claimPayout`, `topUpCollateral`, `withdrawCollateral`, `cancelGroup`, `queryHistory`, `getGroup`, `getMemberPosition`) over a fluent `createSusuClient()` builder,
so that I can integrate Susu into a Solana app in <30 minutes.

## Acceptance Criteria

1. **Given** the Codama-generated TS surface from Epic 1 Story 1.3, **when** `sdk/ts/src/index.ts` exposes the public API, **then** the fluent client is `createSusuClient().use(signer(...)).use(solanaDevnetRpc({...}))`.
2. Every helper accepts a typed argument bag (e.g., `contribute(client, { group, amount })`) and returns a `Promise<TransactionSignature>` for state-changing instructions or a typed account for reads.
3. Every helper internally calls into the Codama-generated instruction builder; no hand-rolled instruction encoding.
4. The helpers are documented inline with JSDoc; every public export has at least one runnable example in the docstring.
5. Unit tests in `sdk/ts/tests/` cover each helper against a mocked RPC.
6. Every state-changing helper, by default, prepends `ComputeBudgetProgram.setComputeUnitLimit(200_000)` and `setComputeUnitPrice(<priorityFee from Helius getPriorityFeeEstimate>)` instructions to the transaction. Override via `{ computeUnits, priorityFee }` opts. Without this, mainnet-beta transactions under 2026 congestion will exceed wall-clock budgets and break the 60s `pnpm susu:demo` claim (FR37, NFR-P3). Use `@solana/kit`'s compute-budget instruction builders (NOT legacy `@solana/web3.js`).

## Tasks / Subtasks

- [x] Author `sdk/ts/src/client.ts` with fluent builder (AC: 1)
  - [x] `createSusuClient(opts)` accepts `{ cluster, rpc, signer? }` and returns a `SusuClient` instance with `.use(plugin)` chaining
  - [x] Internal state holds `{ cluster, rpc, signer, programId }`; throws if `cluster` missing (Story 6.2 enforces stricter rule)
  - [x] Plugin shape: `(client) => Partial<SusuClient>` — composable signer/rpc/cluster plugins
- [x] Implement state-changing helpers (AC: 2, 3)
  - [x] `createGroup(client, args)` → wraps `getCreateGroupInstructionAsync` from `generated/`
  - [x] `acceptInvite(client, args)` → wraps generated `getAcceptInviteInstructionAsync`
  - [x] `postCollateral(client, args)` → wraps generated builder
  - [x] `contribute(client, args)` → wraps generated builder
  - [x] `claimPayout(client, args)` → wraps generated builder
  - [x] `topUpCollateral(client, args)` → wraps generated builder
  - [x] `withdrawCollateral(client, args)` → wraps generated builder
  - [x] `cancelGroup(client, args)` → wraps generated builder
  - [x] Each returns `Promise<TransactionSignature>` (after Story 6.2 wraps with simulate-by-default)
- [x] Implement read helpers (AC: 2, 3)
  - [x] `getGroup(client, groupPda)` → fetches + decodes Group account via `fetchGroup` from `generated/accounts/`
  - [x] `getMemberPosition(client, args)` → derives Member PDA, fetches + decodes
  - [x] `queryHistory(client, args)` → reads RotationHistory entries (paginated)
- [x] Surface public API in `sdk/ts/src/index.ts` (AC: 1)
  - [x] Re-export `createSusuClient`, all helpers, types from `generated/types/`, error classes (Story 6.3)
  - [x] `package.json` `"main"` / `"module"` / `"types"` point at `dist/`; `"exports"` map declares `.` and `./generated`
- [x] Document every public export with JSDoc + runnable example (AC: 4)
  - [x] Each helper has `@example` block with kit-first imports
  - [x] `README.md` for `@susu/sdk` package mirrors top-level docs/sdk-typescript.md
- [x] Unit tests at `sdk/ts/tests/` (AC: 5)
  - [x] Mock RPC via `@solana/kit` test harness or fakes
  - [x] One happy-path test per helper; assert generated builder is invoked with expected args
  - [x] Coverage target: every public export touched by ≥1 test

## Dev Notes

### Architecture compliance (non-negotiables)

- **Kit-first imports only.** All client/RPC code uses `@solana/kit` and `@solana/web3-compat` for legacy boundaries. Importing `@solana/web3.js` is a forbidden pattern enforced by CI lint (Story 1.4). The architecture decision is locked.
- **No hand-rolled instruction encoding.** Every state-changing helper delegates to a Codama-generated builder under `sdk/ts/src/generated/instructions/`. If a helper appears to need custom encoding, the IDL or codegen pipeline is wrong — fix it, do not bypass it.
- **Generated files are read-only.** `sdk/ts/src/generated/` carries the `// DO NOT EDIT — regenerate via pnpm sdk:codegen` banner from Story 1.3. Hand-edits are blocked by CI grep check.
- **Fluent client uses kit's plugin idiom.** `createSusuClient().use(signer(...))` mirrors how `@solana/kit` composes RPC + signer. Do not invent a parallel composition system.
- **Simulate-by-default and explicit-cluster gate land in Story 6.2** — this story authors helpers with the integration points (a `simulate?: boolean` arg threading through, cluster validation hook) but the enforcement logic ships in 6.2.

### Source tree (this story creates/modifies)

```
sdk/ts/
├── package.json                  # MODIFY — public exports, peer deps on @solana/kit + @solana/web3-compat
├── tsconfig.json                 # MODIFY — extends ../../tsconfig.base.json
├── README.md                     # CREATE — package-local quickstart
└── src/
    ├── index.ts                  # CREATE — public API barrel
    ├── client.ts                 # CREATE — createSusuClient + plugin shape
    ├── helpers/
    │   ├── createGroup.ts        # CREATE
    │   ├── acceptInvite.ts       # CREATE
    │   ├── postCollateral.ts     # CREATE
    │   ├── contribute.ts         # CREATE
    │   ├── claimPayout.ts        # CREATE
    │   ├── topUpCollateral.ts    # CREATE
    │   ├── withdrawCollateral.ts # CREATE
    │   ├── cancelGroup.ts        # CREATE
    │   ├── getGroup.ts           # CREATE
    │   ├── getMemberPosition.ts  # CREATE
    │   └── queryHistory.ts       # CREATE
    └── generated/                # READ-ONLY (Story 1.3 owns)

sdk/ts/tests/
├── client.test.ts                # CREATE
├── createGroup.test.ts           # CREATE
├── contribute.test.ts            # CREATE
├── claimPayout.test.ts           # CREATE
└── … one per helper
```

### Project Structure Notes

- This story depends on Story 1.3 (Codama TS codegen) producing `sdk/ts/src/generated/` and Story 1.2 (IDL freeze) producing the locked IDL hash. No re-freeze required for 6.1 — public surface is fixed.
- Peer dependencies declared in `sdk/ts/package.json`: `@solana/kit`, `@solana/web3-compat`. Direct dep: nothing else (helpers are pure typed wrappers around generated code).
- The `package.json` name is `@susu/sdk`; `version` initially `0.1.0-alpha.0` (publish pipeline lands in Story 6.12).

### Forbidden patterns

- `import … from '@solana/web3.js'` anywhere in `sdk/ts/src/` — use `@solana/kit` + `@solana/web3-compat` only.
- Hand-rolling instruction byte layout, discriminators, account-meta arrays — always go through `generated/instructions/`.
- Editing files under `sdk/ts/src/generated/` — read-only; regenerate via `pnpm sdk:codegen`.
- `process.env.X` reads inside the SDK — SDK is config-via-args only.
- Bare `throw new Error('…')` — Story 6.3 mandates typed error classes; author helpers ready to throw the typed classes.

### Testing standards

- Vitest under `sdk/ts/tests/`. One file per helper. Mock RPC via injected fake; assert the helper calls the right Codama builder with the right args. Coverage gate ≥80% on `sdk/ts/src/helpers/`.
- Parity tests vs. Rust SDK (Story 6.5) live in `sdk/ts/tests/parity.test.ts` — author the file stub now with TODO; full assertions land in 6.5.
- CI runs `pnpm --filter @susu/sdk test` on every PR (wired in Story 1.4).

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-6-1-ts-sdk-fluent-client.md`
- BDD scenarios: `tests/atdd/story-6-1-ts-sdk-fluent-client.atdd.md`
- Static red test: `tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs`

### References

- [epics.md §Epic 6 / Story 6.1](../planning-artifacts/epics.md) — BDD ACs verbatim
- [architecture.md §Core Architectural Decisions](../planning-artifacts/architecture.md) — kit-first SDK strategy, ARCH-26 (publish), ARCH-42 (error classes)
- [architecture.md §Implementation Patterns & Consistency Rules](../planning-artifacts/architecture.md) — forbidden imports, fluent-client convention
- [architecture.md §Project Structure](../planning-artifacts/architecture.md) — `sdk/ts/` layout
- [prd.md §FR31](../planning-artifacts/prd.md) — TS SDK helper surface

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs` failed before implementation with missing client/helper/README/export surface, then passed after implementation.
- `pnpm --filter @susu/sdk build` passed after implementation.
- `pnpm --filter @susu/sdk test` passed after implementation: 20 passed, 1 todo.
- `pnpm test:atdd` passed after implementation: 151 passed.
- `bash scripts/check-patterns.sh` passed.
- `bash scripts/check-sdk-parity.sh` passed and did not modify generated files.
- `pnpm --filter @susu/sdk test` passed after test-review cleanup: 20 passed, 1 todo.
- `pnpm install --frozen-lockfile` passed after dependency/export changes.
- Code review completed with no remaining findings.

### Completion Notes List

- Added fluent `SusuClient` with `createSusuClient().use(...)`, signer/RPC/cluster plugins, typed config errors, and default Susu program ID.
- Added state-changing helper wrappers that call the current Codama-generated builder functions under `sdk/ts/src/generated/instructions/`; no generated files were edited.
- Added compute-budget prepending through kit-compatible `@solana-program/compute-budget` builders, Helius-style `getPriorityFeeEstimate` support, and `{ computeUnits, priorityFee }` overrides.
- Added client-based read wrappers over existing generated decoder/PDA query helpers.
- Added package-local README, dist export map, and mocked Vitest coverage for client, state helpers, and read helpers.
- Test review completed with no remaining findings; strengthened state-helper tests to assert per-helper generated-builder argument bags.
- Code review completed clean; no patch, decision, or deferred findings remain.

### File List

- `pnpm-lock.yaml`
- `sdk/ts/package.json`
- `sdk/ts/README.md`
- `sdk/ts/src/client.ts`
- `sdk/ts/src/index.ts`
- `sdk/ts/src/helpers/acceptInvite.ts`
- `sdk/ts/src/helpers/cancelGroup.ts`
- `sdk/ts/src/helpers/claimPayout.ts`
- `sdk/ts/src/helpers/contribute.ts`
- `sdk/ts/src/helpers/createGroup.ts`
- `sdk/ts/src/helpers/getGroup.ts`
- `sdk/ts/src/helpers/getMemberPosition.ts`
- `sdk/ts/src/helpers/internal/state.ts`
- `sdk/ts/src/helpers/postCollateral.ts`
- `sdk/ts/src/helpers/queryHistory.ts`
- `sdk/ts/src/helpers/topUpCollateral.ts`
- `sdk/ts/src/helpers/withdrawCollateral.ts`
- `sdk/ts/tests/client.test.ts`
- `sdk/ts/tests/parity.test.ts`
- `sdk/ts/tests/read-helpers.test.ts`
- `sdk/ts/tests/state-helpers.test.ts`
- `tests/atdd/story-6-1-ts-sdk-fluent-client.static.red.test.mjs`
- `output_susu/test-artifacts/test-reviews/story-6-1-test-review.md`
- `output_susu/test-artifacts/code-reviews/story-6-1-code-review.md`

### Change Log

- 2026-05-08: Implemented Story 6.1 SDK fluent client, helpers, docs, package exports, and tests. Moved story to review pending BAD review/PR gates.
- 2026-05-08: Ran test review, fixed the only cleanup item, and recorded no remaining test-review findings.
- 2026-05-08: Ran code review and recorded no remaining findings.
