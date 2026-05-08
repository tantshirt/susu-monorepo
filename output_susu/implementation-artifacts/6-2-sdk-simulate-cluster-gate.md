# Story 6.2: SDK simulate-by-default + explicit-cluster gate

Status: ready-for-dev

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

- [ ] Implement explicit-cluster gate in `createSusuClient` (AC: 3)
  - [ ] Constructor signature: `createSusuClient({ cluster: 'devnet' | 'mainnet-beta' | 'localnet' | 'testnet', rpc, signer? })`
  - [ ] Throw `SusuClusterError` synchronously if `cluster` is undefined / empty
  - [ ] Cross-check: if RPC endpoint resolves to mainnet (heuristic via genesis hash or known endpoints) AND `cluster !== 'mainnet-beta'` → throw `SusuClusterError`
  - [ ] Document the heuristic in `docs/sdk-typescript.md` (it is a defense-in-depth, not a hard guarantee)
- [ ] Wire simulate-by-default into every state-changing helper (AC: 1, 2)
  - [ ] Each helper accepts `opts?: { simulate?: boolean }` defaulting to `simulate: true`
  - [ ] Build the transaction; if `simulate: true`, call `rpc.simulateTransaction(tx)` first
  - [ ] On simulation success, send + confirm; return `TransactionSignature`
  - [ ] On simulation failure, throw `SusuSimulationError({ logs, programLogs, error })` - never proceed to send
  - [ ] Refactor `contribute`, `createGroup`, `acceptInvite`, `postCollateral`, `claimPayout`, `topUpCollateral`, `withdrawCollateral`, `cancelGroup` to share a `executeTx(client, ix, opts)` helper that encapsulates simulate->send
- [ ] Surface `SusuClusterError` (AC: 3)
  - [ ] Stub class in `sdk/ts/src/errors.ts` (full taxonomy lands in Story 6.3 - this story creates the file and the cluster error)
- [ ] Unit tests at `sdk/ts/tests/` (AC: 4)
  - [ ] `client.test.ts` - missing `cluster` throws; mainnet-resolved + `cluster: 'devnet'` throws
  - [ ] `simulate.test.ts` - simulation-success path returns sig; simulation-failure path throws `SusuSimulationError` with logs
  - [ ] `simulate.test.ts` - `simulate: false` skips simulation (escape hatch documented as advanced)
- [ ] Author `docs/sdk-typescript.md` simulate + cluster section (AC: 5)
  - [ ] Code samples for: default-safe usage, explicit `simulate: false`, mainnet-beta production usage
  - [ ] Failure-mode table mapping `SusuSimulationError` / `SusuClusterError` to recovery hints

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

_TBD_

### Debug Log References

### Completion Notes List

### File List
