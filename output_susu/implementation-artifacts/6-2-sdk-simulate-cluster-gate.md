# Story 6.2: SDK simulate-by-default + explicit-cluster gate

Status: done

## Story

As an integrator,
I want every SDK transaction-builder helper to run `simulateTransaction` by default before requesting a signature, and to refuse mainnet sends unless `cluster: 'mainnet-beta'` is explicitly passed,
so that integrators can't accidentally send a mainnet transaction or skip simulation.

## Acceptance Criteria

1. **Given** the SDK helpers from Story 6.1, **when** any state-changing helper is invoked, **then** the helper accepts a `simulate: boolean` parameter defaulting to `true`.
2. When `simulate: true`, the helper calls `simulateTransaction` first; on simulation failure, it throws `SusuSimulationError` with the simulation log.
3. The SDK's `createSusuClient()` requires an explicit `cluster` parameter; if `cluster: 'mainnet-beta'` is not passed and the call resolves to mainnet, the helper throws `SusuClusterError` before any transaction is built.
4. Unit tests cover: simulation-success path, simulation-failure path, missing-cluster rejection, explicit-mainnet success path.
5. The behavior is documented in `docs/sdk-typescript.md` with examples.

## Tasks / Subtasks

- [x] Implement explicit-cluster gate in `createSusuClient` (AC: 3)
  - [x] Constructor signature: `createSusuClient({ cluster: 'devnet' | 'mainnet-beta' | 'localnet' | 'testnet', rpc, signer? })`
  - [x] Throw `SusuClusterError` synchronously if `cluster` is undefined / empty
  - [x] Cross-check: if RPC endpoint resolves to mainnet (heuristic via genesis hash or known endpoints) AND `cluster !== 'mainnet-beta'` -> throw `SusuClusterError`
  - [x] Document the heuristic in `docs/sdk-typescript.md` (it is a defense-in-depth, not a hard guarantee)
- [x] Wire simulate-by-default into every state-changing helper (AC: 1, 2)
  - [x] Each helper accepts `opts?: { simulate?: boolean }` defaulting to `simulate: true`
  - [x] Build the transaction; if `simulate: true`, call `rpc.simulateTransaction(tx)` first
  - [x] On simulation success, send + confirm; return `TransactionSignature`
  - [x] On simulation failure, throw `SusuSimulationError({ logs, programLogs, error })` - never proceed to send
  - [x] Refactor `contribute`, `createGroup`, `acceptInvite`, `postCollateral`, `claimPayout`, `topUpCollateral`, `withdrawCollateral`, `cancelGroup` to share a `executeTx(client, ix, opts)` helper that encapsulates simulate->send
- [x] Surface `SusuClusterError` (AC: 3)
  - [x] Stub class in `sdk/ts/src/errors.ts` (full taxonomy lands in Story 6.3 - this story creates the file and the cluster error)
- [x] Unit tests at `sdk/ts/tests/` (AC: 4)
  - [x] `client.test.ts` - missing `cluster` throws; mainnet-resolved + `cluster: 'devnet'` throws
  - [x] `simulate.test.ts` - simulation-success path returns sig; simulation-failure path throws `SusuSimulationError` with logs
  - [x] `simulate.test.ts` - `simulate: false` skips simulation (escape hatch documented as advanced)
- [x] Author `docs/sdk-typescript.md` simulate + cluster section (AC: 5)
  - [x] Code samples for: default-safe usage, explicit `simulate: false`, mainnet-beta production usage
  - [x] Failure-mode table mapping `SusuSimulationError` / `SusuClusterError` to recovery hints

## Dev Notes

### Architecture compliance (non-negotiables)

- **Simulate-by-default is a structural safety property.** FR34 mandates "every send simulates first; only ship if simulation passes." There is no global toggle to disable it - only a per-call `simulate: false` escape hatch for advanced use (e.g., a relayer that already simulated upstream).
- **Explicit-cluster gate is non-bypassable.** FR35: no defaulting to devnet, no defaulting to mainnet, no inferring from RPC URL alone. The user must pass `cluster: '...'` literally. The mainnet-resolution cross-check is defense-in-depth.
- **Errors are typed.** `SusuClusterError` and `SusuSimulationError` extend `Error`, carry typed fields, and discriminate via a `kind` field for pattern-matching. Full taxonomy lands in Story 6.3 - this story stubs `errors.ts` and ships the two needed classes.
- **`executeTx` is the only path to send.** Every helper goes through it. CI lint (added in 6.3 / 6.5 phase) greps for `rpc.sendTransaction` outside `executeTx` - direct sends are forbidden.
- **Kit-first.** Use `@solana/kit` simulate + send APIs, not legacy `@solana/web3.js` `connection.simulateTransaction`.

### Source tree (this story creates/modifies)

```
sdk/ts/src/
├── client.ts                     # MODIFY - explicit-cluster gate
├── errors.ts                     # CREATE - SusuClusterError, SusuSimulationError stubs
├── lib/
│   └── executeTx.ts              # CREATE - shared simulate-then-send wrapper
└── helpers/                      # MODIFY all 8 state-changing helpers to call executeTx

sdk/ts/tests/
├── client.test.ts                # MODIFY - cluster gate cases
└── simulate.test.ts              # CREATE - simulate paths

docs/
└── sdk-typescript.md             # MODIFY (or CREATE) - simulate + cluster section
```

### Project Structure Notes

- Depends on Story 6.1 (helpers exist). Does not require IDL re-freeze - public arg shape is `{ ...args, simulate?: boolean }`, an additive optional. SDK changes here do not affect the program; no IDL re-freeze.
- `executeTx` is internal (`sdk/ts/src/lib/`) - not re-exported from `index.ts`. Only helpers use it.
- `docs/sdk-typescript.md` is the canonical SDK reference doc; multiple stories (6.1, 6.2, 6.3) contribute sections to it.

### Forbidden patterns

- Direct `rpc.sendTransaction(...)` calls in helpers - must go through `executeTx`.
- Defaulting `cluster` to any value (`'devnet'`, `'mainnet-beta'`, etc.) - `cluster` is required.
- Swallowing simulation logs - `SusuSimulationError` must carry the full logs array.
- `import ... from '@solana/web3.js'` (still forbidden from Story 6.1).

### Testing standards

- Vitest. Mock the RPC's `simulateTransaction` and `sendTransaction` methods. Cover success + failure for both, plus the cluster-gate cases. Coverage gate >=90% on `sdk/ts/src/lib/executeTx.ts`.
- A "no direct send" CI lint check is wired in Story 6.5 / 6.11 - this story should already be clean against it.

### References

- [epics.md §Epic 6 / Story 6.2](../planning-artifacts/epics.md) - BDD ACs
- [architecture.md §Core Architectural Decisions](../planning-artifacts/architecture.md) - simulate-by-default, explicit-cluster
- [prd.md §FR34, §FR35](../planning-artifacts/prd.md) - functional requirements
- [Story 6.1](6-1-ts-sdk-fluent-client.md) - helper baseline
- [Story 6.3](6-3-sdk-error-classes.md) - full error taxonomy

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs` failed before implementation with missing `errors.ts`, `lib/executeTx.ts`, `simulate.test.ts`, and `docs/sdk-typescript.md`.
- `pnpm install --frozen-lockfile` passed in the story worktree; `tsc` was unavailable until `typescript` was added as an SDK dev dependency.
- `pnpm --filter @susu/sdk build` passed after implementation.
- `pnpm --filter @susu/sdk test` passed after implementation: 28 passed, 1 todo.
- `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs` passed after implementation.
- `pnpm test:atdd` passed after implementation: 155 passed.
- `git diff --check` passed.
- `bash scripts/check-patterns.sh` passed.
- `bash scripts/check-sdk-parity.sh` passed and did not modify generated files.
- `pnpm --filter @susu/sdk test` passed after test-review cleanup: 28 passed, 1 todo.
- `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs` passed after test-review cleanup.
- `pnpm --filter @susu/sdk build` passed after code-review fix.
- `pnpm --filter @susu/sdk test` passed after code-review fix: 29 passed, 1 todo.
- `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs` passed after code-review fix.
- `pnpm test:atdd` passed after code-review fix: 155 passed.
- `bash scripts/check-patterns.sh` passed after code-review fix.
- `bash scripts/check-sdk-parity.sh` passed after code-review fix and did not modify generated files.
- `rg -n "@solana/web3\\.js" sdk/ts/src` returned no matches after code-review fix.
- Cursor Bugbot reported a high-severity truncated-mainnet-genesis-hash finding on PR #178 head `2f200c86317712a11d13ba2a716420aa6bd25791`; fixed by using the full Solana mainnet-beta genesis hash and adding a constant regression test.
- Cursor fix validation passed `pnpm --filter @susu/sdk build`, `pnpm --filter @susu/sdk test` (30 passed, 1 todo), `node --test tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs`, `pnpm test:atdd` (155 passed), and `git diff --check`.
- Pre-done PR gate check on PR #178 passed for head `6310bc36fa0154083489cd3c5fa97a64f3345ad0`: `lint-and-build` succeeded at `https://github.com/tantshirt/susu-monorepo/actions/runs/25567448622/job/75054410914`, Cursor Bugbot completed `SUCCESS`, and GraphQL review-thread audit found the Cursor thread resolved/outdated with no unresolved current-head Cursor threads, no PR comments, and only the old Cursor review on commit `2f200c86317712a11d13ba2a716420aa6bd25791`.

### Completion Notes List

- Added typed `SusuClusterError` and `SusuSimulationError` with discriminating `kind` fields and carried cluster/simulation metadata.
- Made `cluster` required for `createSusuClient` and `SusuClient`, rejecting missing/empty/unsupported clusters synchronously.
- Added known mainnet endpoint and `getGenesisHash` defense-in-depth checks, with helper-level genesis checks running before generated instruction builders.
- Added internal `executeTx` that prepends compute budget instructions, simulates by default, preserves simulation logs on failure, and returns the send signature.
- Routed state-changing helpers through `executeTx` via the shared state helper adapter.
- Added client and simulation Vitest coverage for missing cluster, mainnet mismatch, explicit mainnet success, simulation success/failure, and `simulate: false`.
- Added `docs/sdk-typescript.md` and updated SDK README/JSDoc examples for explicit cluster and simulation behavior.
- Added `typescript` as an SDK dev dependency so `pnpm --filter @susu/sdk build` has a direct `tsc` binary.
- Test review fixed the duplicated simulation-failure invocation and left no remaining findings.
- Code review fixed simulation-error normalization for logs-only failures and rejected simulation RPC calls; no remaining findings.
- Cursor Bugbot fix corrected `MAINNET_BETA_GENESIS_HASH` to the full 44-character mainnet-beta genesis hash.
- Marked Story 6.2 done after clean implementation-head CI and Cursor evidence; the status-only commit will be re-gated before merge.

### File List

- `pnpm-lock.yaml`
- `docs/sdk-typescript.md`
- `sdk/ts/package.json`
- `sdk/ts/README.md`
- `sdk/ts/src/client.ts`
- `sdk/ts/src/errors.ts`
- `sdk/ts/src/index.ts`
- `sdk/ts/src/lib/executeTx.ts`
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
- `sdk/ts/tests/simulate.test.ts`
- `sdk/ts/tests/state-helpers.test.ts`
- `tests/atdd/story-6-2-sdk-simulate-cluster-gate.atdd.md`
- `tests/atdd/story-6-2-sdk-simulate-cluster-gate.static.red.test.mjs`
- `output_susu/test-artifacts/atdd-checklist-6-2-sdk-simulate-cluster-gate.md`
- `output_susu/test-artifacts/test-reviews/story-6-2-test-review.md`
- `output_susu/test-artifacts/code-reviews/story-6-2-code-review.md`
- `output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md`

### Change Log

- 2026-05-08: Added ATDD artifacts for Story 6.2 and captured the red-phase failure.
- 2026-05-08: Implemented simulate-by-default transaction execution, explicit cluster gate, typed errors, docs, and unit coverage. Moved story to review pending BAD review/PR gates.
- 2026-05-08: Ran test review, fixed the duplicated simulation-failure helper invocation, and recorded no remaining findings.
- 2026-05-08: Ran code review, fixed simulation-error normalization edge cases, and recorded no remaining findings.
- 2026-05-08: Fixed Cursor Bugbot truncated mainnet genesis hash finding and reran story-local validation.
- 2026-05-08: Marked Story 6.2 done after clean PR CI and Cursor evidence; pending status-only PR re-gate before merge.
