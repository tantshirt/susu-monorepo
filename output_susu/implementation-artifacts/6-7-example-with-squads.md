# Story 6.7: examples/with-squads (~200 LOC)

Status: done

## Story

As Aisha (forking developer),
I want `examples/with-squads/` demonstrating a Susu group governed by a Squads multisig (multisig as the Group Creator),
so that I can build governance-controlled circles by copy-pasting the pattern.

## Acceptance Criteria

1. **Given** the SDK and Squads SDK, **when** `cd examples/with-squads && pnpm install && pnpm start` runs, **then** the example creates a Squads multisig and uses it as the Group Creator for a Susu group.
2. The example is ≤200 LOC, has its own README, and is independently runnable.
3. Unit/e2e tests cover the multisig-as-creator happy path.
4. The example documents the trade-offs of multisig governance in its README.

## Tasks / Subtasks

- [x] Scaffold `examples/with-squads/` package (AC: 1, 2)
  - [x] `package.json` with `name: "@susu-examples/with-squads"`, `private: true`, scripts `start`, `test`, `build`
  - [x] Dependencies: `@susu/sdk` (workspace:*), `@sqds/multisig` (Squads v4 SDK), `@solana/kit`, `@solana/web3-compat`
  - [x] `tsconfig.json` extends root base
  - [x] `.env.example` with `HELIUS_RPC_URL`, `CLUSTER=devnet`, optional `MULTISIG_PUBKEY` for using existing
- [x] Implement integration script (AC: 1)
  - [x] `src/index.ts` — orchestrates:
    - [x] (1) Either create a new 2-of-3 Squads multisig OR connect to existing via env
    - [x] (2) `createSusuClient({ cluster: 'devnet', rpc, signer: multisigSigner })`
    - [x] (3) Build `createGroup` instruction; wrap in Squads `vault_transaction_create` proposal
    - [x] (4) Threshold members approve proposal; execute
    - [x] (5) Verify group's `creator` field == Squads vault PDA; print result
  - [x] `src/multisigSigner.ts` — adapter wrapping Squads vault signing as `@solana/kit` `TransactionSigner` (note: Squads is not a single-key signer — adapter constructs proposals)
  - [x] LOC ≤200 in `src/`
- [x] Author `examples/with-squads/README.md` (AC: 2, 4)
  - [x] `## What this demonstrates` — Squads multisig as Susu Group Creator (governance-controlled circles)
  - [x] `## Setup` — env vars, multisig threshold, members
  - [x] `## Run` — `pnpm start`
  - [x] `## Trade-offs of multisig governance` — latency (2 txs minimum), recovery vs. censorship, threshold sizing, mainnet considerations
  - [x] `## See also` — `docs/integration-squads.md` (Story 6.9)
- [x] Independent runnability
  - [x] No imports from `apps/reference/` or other examples
- [x] Tests at `examples/with-squads/tests/` (AC: 3)
  - [x] Unit: adapter constructs Squads proposals correctly (mock Squads)
  - [x] e2e: against devnet/Surfpool — happy path with mock 2-of-3 keypair multisig; assert group `creator` is the multisig PDA

## Dev Notes

### Architecture compliance (non-negotiables)

- **Squads is NOT a key-replacement signer.** It's a governance/proposal layer. The adapter constructs proposals; threshold members approve; the multisig executes. The Susu SDK sees the multisig PDA as the signer (via `vault_transaction`).
- **Group `creator` is the Squads vault PDA controlled by the multisig, not a member's key.** This is the load-bearing pattern this example teaches because Squads vault transactions sign inner instructions from the vault authority.
- **≤200 LOC, independent runnability** — same constraints as Story 6.6.
- **Kit-first, devnet default, partner SDK pinned** — same as 6.6.
- **Trade-offs section in README is required.** Multisig latency and complexity are real; integrators must understand before copy-pasting.

### Source tree (this story creates/modifies)

```
examples/with-squads/
├── package.json                  # CREATE
├── tsconfig.json                 # CREATE
├── README.md                     # CREATE
├── .env.example                  # CREATE
├── src/
│   ├── index.ts                  # CREATE
│   └── multisigSigner.ts         # CREATE — adapter
└── tests/
    ├── adapter.test.ts           # CREATE
    └── e2e.test.ts               # CREATE
```

### Project Structure Notes

- Depends on Stories 6.1–6.3 (`@susu/sdk`) and Squads v4 SDK availability.
- Workspace member under `examples/*`.
- The example does NOT require modifying the Susu program — Susu accepts any signer pubkey as `creator`; multisig PDA is just a pubkey from Susu's perspective. This is by design — Susu's primitive is composable.

### Forbidden patterns

- `@solana/web3.js` imports.
- Cross-example imports.
- Hardcoded multisig pubkeys, member keys, secrets — all via env.
- LOC >200 in `src/`.
- Skipping the trade-offs README section.

### Testing standards

- Vitest. e2e gated behind `PNPM_TEST_E2E=1`. Squads operations on devnet are slow — set per-test timeout to 2min.
- CI runs unit always; e2e on `main` commits only (cost/time concern).

### References

- [epics.md §Epic 6 / Story 6.7](../planning-artifacts/epics.md) — BDD ACs
- [architecture.md §Project Structure](../planning-artifacts/architecture.md) — `examples/*` layout
- [prd.md §FR36](../planning-artifacts/prd.md) — examples requirement
- [Story 6.9](6-9-integration-docs.md) — companion doc

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-6-7-example-with-squads.static.red.test.mjs`
- `pnpm --filter @susu-examples/with-squads build`
- `pnpm --filter @susu-examples/with-squads test`
- `PNPM_TEST_E2E=1 pnpm --filter @susu-examples/with-squads test`
- `pnpm --filter @susu-examples/with-squads start`

### Completion Notes List

- Added an independently runnable `examples/with-squads` package using Squads v4 SDK PDA helpers and a local dry-run gateway.
- Implemented a Squads multisig signer adapter that proposes, approves, executes, and verifies Susu `createGroup` with the multisig PDA as creator.
- Added package unit/e2e tests plus ATDD static coverage for package shape, line budget, README trade-offs, and forbidden imports.
- Documented governance trade-offs and live-mainnet considerations in the example README.

### File List

- `examples/with-squads/package.json`
- `examples/with-squads/tsconfig.json`
- `examples/with-squads/.env.example`
- `examples/with-squads/src/index.ts`
- `examples/with-squads/src/multisigSigner.ts`
- `examples/with-squads/tests/adapter.test.ts`
- `examples/with-squads/tests/e2e.test.ts`
- `examples/with-squads/README.md`
- `tests/atdd/story-6-7-example-with-squads.atdd.md`
- `tests/atdd/story-6-7-example-with-squads.static.red.test.mjs`
- `output_susu/test-artifacts/atdd-checklist-6-7-example-with-squads.md`
- `output_susu/test-artifacts/test-reviews/story-6-7-test-review.md`
- `output_susu/test-artifacts/code-reviews/story-6-7-code-review.md`
- `log/2026-05-09.md`
- `pnpm-lock.yaml`
