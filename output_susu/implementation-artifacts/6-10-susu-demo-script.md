# Story 6.10: pnpm susu:demo orchestrator hitting NFR-P2 <=60s

Status: ready-for-dev

## Story

As Aisha (forking developer) and as a CI verifier,
I want `pnpm susu:demo` to execute a complete mock ROSCA cycle (create -> join -> contribute -> rotate -> payout) against devnet in <=60 seconds wall-clock,
so that the "60-second demo" promise is structural and CI verifies it on every main commit.

## Acceptance Criteria

1. **Given** the program deployed to devnet and the SDK published, **when** `pnpm susu:demo` runs from a clean clone, **then** `scripts/susu-demo.sh` orchestrates a 5-member mock circle end-to-end against devnet.
2. The script outputs are structured + colored matching the UX-DR50 mock (Anchor toolchain check, Solana CLI check, devnet RPC reachable, funded keypair, group create with tx hash, members joining, rounds 1-5 with checkmarks, total wall-clock printed).
3. The total wall-clock from invocation to "Demo complete" is <=60s on a 4-core developer laptop with stable Helius RPC (NFR-P2).
4. Failure paths are classified into 3 buckets (RPC reachability, devnet airdrop limit, dependency mismatch) with one-line recovery hints + docs links.
5. `.github/workflows/ci.yml` runs `pnpm susu:demo` against a Surfpool fork on every main-branch commit and asserts wall-clock <=60s.

## Tasks / Subtasks

- [ ] Author `scripts/susu-demo.sh` (AC: 1, 2, 3)
  - [ ] Bash strict mode (`set -euo pipefail`)
  - [ ] Phase 0: pre-flight checks (anchor, solana CLI, node, pnpm versions; devnet RPC reachable; keypair funded >=0.5 SOL)
  - [ ] Phase 1: airdrop-or-reuse 5 mock keypairs; print derived addresses
  - [ ] Phase 2: invoke `node scripts/susu-demo.mjs` (TS-compiled or `tsx`-driven runner that uses `@susu/sdk`)
  - [ ] Runner: `createGroup` -> 5x `acceptInvite` + `postCollateral` -> 5 rotation rounds (`contribute` x 5 members per round, `claimPayout` for the round's recipient)
  - [ ] Each phase prints structured colored output (cyan headers, green checkmarks, red errors) matching UX-DR50 mock
  - [ ] Final line: `Demo complete. Wall-clock: Xs.`
- [ ] Wire the runner into `scripts/susu-demo.mjs` (AC: 1, 3)
  - [ ] Uses `@susu/sdk` (workspace:* in dev, `@susu/sdk@latest` post-publish)
  - [ ] Parallelizes member joins where possible (different members can `acceptInvite` concurrently)
  - [ ] Each round: 5 contributions in parallel, then 1 payout
  - [ ] Logs each tx signature + Solscan link
- [ ] Performance budget engineering (AC: 3)
  - [ ] Target <=60s on devnet with Helius RPC (typical confirmation ~400-800ms)
  - [ ] Use `commitment: 'confirmed'` (not `'finalized'`) for in-demo waits
  - [ ] Batch parallelizable txs; avoid serializing what can be concurrent
  - [ ] If budget cannot be met without Surfpool fork, document the gap in `log/` and adjust target - but devnet target is the headline NFR-P2 promise
- [ ] Failure-path classification (AC: 4)
  - [ ] Wrap the runner in a top-level try/catch that classifies errors into 3 buckets:
    - [ ] RPC reachability (timeouts, 5xx) -> "Helius/Solana devnet RPC unreachable. See docs/troubleshooting.md#rpc"
    - [ ] Devnet airdrop limit (`Airdrop request failed` patterns) -> "Devnet airdrop rate limit. Run `solana airdrop 2` manually or wait 24h."
    - [ ] Dependency mismatch (anchor/solana CLI version mismatch) -> "Toolchain mismatch. Run `nvm use && rustup show`."
  - [ ] Each error message ends with a docs link
- [ ] Wire `pnpm susu:demo` script in root `package.json` (AC: 1)
  - [ ] `"susu:demo": "bash scripts/susu-demo.sh"`
- [ ] CI integration (AC: 5)
  - [ ] `.github/workflows/ci.yml` adds `susu-demo-smoke` job triggered on `main` push
  - [ ] Job spins up Surfpool fork (forked devnet), runs `pnpm susu:demo` against the fork's RPC URL
  - [ ] Asserts wall-clock <= 60 (read from final `Wall-clock: Xs` line)
  - [ ] >60s = workflow failure (release-blocker)

## Dev Notes

### Architecture compliance (non-negotiables)

- **NFR-P2 (<=60s) is a hard performance budget.** The "60-second demo" is a public-facing promise; the script and CI assertion are the structural enforcement. Regression past 60s is a release-blocker.
- **Output style matches UX-DR50 mock.** Structured, colored, scannable. Use a tiny color helper (no heavy deps; ANSI escapes are fine). The mock is in the UX spec.
- **Devnet is the headline target.** Surfpool fork is acceptable for CI determinism (devnet is flaky); the README's "60-second demo" claim is for devnet on a real machine. Both must pass.
- **Failure classification is non-optional.** Aisha gets a useful error or a useless one - the difference between her continuing or dropping the project. Three buckets cover ~95% of real failure modes.
- **No `@solana/web3.js` in the demo runner.** Kit-first via `@susu/sdk`.

### Source tree (this story creates/modifies)

```
scripts/
├── susu-demo.sh                  # CREATE - orchestrator
└── susu-demo.mjs                 # CREATE - TS runner driving the SDK

package.json                      # MODIFY - add "susu:demo" script
.github/workflows/ci.yml          # MODIFY - add susu-demo-smoke job

docs/
└── troubleshooting.md            # CREATE or MODIFY - failure-mode bucket docs
```

### Project Structure Notes

- Depends on Stories 6.1-6.3 (`@susu/sdk`), the deployed devnet program, and Surfpool availability for CI.
- The runner uses `@susu/sdk` workspace-linked during local dev; post-publish (Story 6.12) it could use the published package, but workspace-linked is fine and faster for iteration.
- `.env` for the demo (RPC URL, keypair path) follows the `.env.example` pattern.

### Forbidden patterns

- `@solana/web3.js` imports in the runner.
- Hardcoded Solscan URLs without using cluster-aware helpers.
- Silent failures - every error must classify into a bucket and print a hint.
- Wall-clock measurement bypassing the assertion (e.g., printing time but not failing on >60s).
- Long sleeps for demo pacing - speed is the feature.

### Testing standards

- The script is "tested" by CI on every main commit (the assertion job).
- Locally, `pnpm susu:demo` is the smoke test. Document in `docs/troubleshooting.md` how to interpret each failure bucket.
- No unit tests for bash; the mjs runner could have unit tests for the classification logic - recommended, optional.

### References

- [epics.md §Epic 6 / Story 6.10](../planning-artifacts/epics.md) - BDD ACs
- [prd.md §FR37, §NFR-P2](../planning-artifacts/prd.md) - demo + 60s budget
- [UX spec UX-DR50](../planning-artifacts/ux-design-spec.md) - output mock
- [Story 6.1](6-1-ts-sdk-fluent-client.md) - SDK consumed
- [Story 6.11](6-11-verify-orchestrator.md) - sibling orchestrator (verify)

## Dev Agent Record

### Agent Model Used

_TBD_

### Debug Log References

### Completion Notes List

### File List
