# Story 6.10: pnpm susu:demo orchestrator hitting NFR-P2 <=60s

Status: review

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

- [x] Author `scripts/susu-demo.sh` (AC: 1, 2, 3)
  - [x] Bash strict mode (`set -euo pipefail`)
  - [x] Phase 0: pre-flight checks (anchor, solana CLI, node, pnpm versions; devnet RPC reachable; keypair funded >=0.5 SOL)
  - [x] Phase 1: airdrop-or-reuse 5 mock keypairs; print derived addresses
  - [x] Phase 2: invoke `node scripts/susu-demo.mjs` (TS-compiled or `tsx`-driven runner that uses `@susu/sdk`)
  - [x] Runner: `createGroup` -> 5x `acceptInvite` + `postCollateral` -> 5 rotation rounds (`contribute` x 5 members per round, `claimPayout` for the round's recipient)
  - [x] Each phase prints structured colored output (cyan headers, green checkmarks, red errors) matching UX-DR50 mock
  - [x] Final line: `Demo complete. Wall-clock: Xs.`
- [x] Wire the runner into `scripts/susu-demo.mjs` (AC: 1, 3)
  - [x] Uses `@susu/sdk` (workspace:* in dev, `@susu/sdk@latest` post-publish)
  - [x] Parallelizes member joins where possible (different members can `acceptInvite` concurrently)
  - [x] Each round: 5 contributions in parallel, then 1 payout
  - [x] Logs each tx signature + Solscan link
- [x] Performance budget engineering (AC: 3)
  - [x] Target <=60s on devnet with Helius RPC (typical confirmation ~400-800ms)
  - [x] Use `commitment: 'confirmed'` (not `'finalized'`) for in-demo waits
  - [x] Batch parallelizable txs; avoid serializing what can be concurrent
  - [x] If budget cannot be met without Surfpool fork, document the gap in `log/` and adjust target - but devnet target is the headline NFR-P2 promise
- [x] Failure-path classification (AC: 4)
  - [x] Wrap the runner in a top-level try/catch that classifies errors into 3 buckets:
    - [x] RPC reachability (timeouts, 5xx) -> "Helius/Solana devnet RPC unreachable. See docs/troubleshooting.md#rpc"
    - [x] Devnet airdrop limit (`Airdrop request failed` patterns) -> "Devnet airdrop rate limit. Run `solana airdrop 2` manually or wait 24h."
    - [x] Dependency mismatch (anchor/solana CLI version mismatch) -> "Toolchain mismatch. Run `nvm use && rustup show`."
  - [x] Each error message ends with a docs link
- [x] Wire `pnpm susu:demo` script in root `package.json` (AC: 1)
  - [x] `"susu:demo": "bash scripts/susu-demo.sh"`
- [x] CI integration (AC: 5)
  - [x] `.github/workflows/ci.yml` adds `susu-demo-smoke` job triggered on `main` push
  - [x] Job spins up Surfpool fork (forked devnet), runs `pnpm susu:demo` against the fork's RPC URL
  - [x] Asserts wall-clock <= 60 (read from final `Wall-clock: Xs` line)
  - [x] >60s = workflow failure (release-blocker)

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

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs` (red before implementation; green after implementation)
- `pnpm install --frozen-lockfile`
- `SUSU_DEMO_SKIP_PREFLIGHT=1 SUSU_DEMO_MAX_SECONDS=60 pnpm susu:demo`
- `pnpm test:atdd`
- `pnpm --filter @susu/sdk test`
- `bash scripts/check-patterns.sh`
- `bash scripts/check-sdk-parity.sh`
- Cursor Bugbot PR #184 reviews: fixed budget-breach classification, moved shell/JS failure classification to one shared module, narrowed dependency mismatch and airdrop-rate matching, gitignored generated demo keypairs, aligned SDK client and Solscan clusters with `SUSU_DEMO_CLUSTER`, and exported the Surfpool install PATH before the same-step version check.

### Completion Notes List

- Added the `pnpm susu:demo` shell orchestrator with strict preflight, colored structured output, keypair funding/airdrop handling, failure buckets, and <=60s wall-clock assertion.
- Added the SDK-backed mock ROSCA runner using `@susu/sdk` helpers for group create, member join/collateral, 5 contribution rounds, and 5 payouts with cluster-aware Solscan links.
- Documented RPC, airdrop, dependency mismatch, and performance budget recovery paths in `docs/troubleshooting.md`.
- Added a `susu-demo-smoke` GitHub Actions job for main-branch Surfpool devnet-fork execution and wall-clock parsing.
- Test review added runtime coverage proving the shell exits non-zero when the NFR-P2 wall-clock budget is exceeded.
- Code review hardened the Surfpool smoke job with `--ci --no-deploy` so CI starts only the forked RPC needed by the demo.
- Cursor review recovery added a dedicated `performance-budget` failure bucket and narrowed dependency mismatch detection so RPC failures can reach the `rpc-reachability` bucket.
- Cursor follow-up recovery exported `$HOME/.local/bin` and `$HOME/.cargo/bin` during the Surfpool install step before running `surfpool --version`.
- Cursor follow-up recovery moved classifier logic into `scripts/susu-demo-classify.mjs` so shell and runner share the same buckets, and kept RPC HTTP 429 under `rpc-reachability`.
- Cursor follow-up recovery added `.susu-demo/` to `.gitignore` and stopped hardcoding the SDK client cluster to devnet.
- Cursor follow-up recovery preserved non-mainnet clusters in Solscan links instead of mapping every non-mainnet cluster to devnet.
- Cursor follow-up recovery fixed dependency-classifier spacing so `anchor mismatch` and `solana required` stay in the dependency bucket.
- Cursor follow-up recovery decoupled classifier ATDD from the SDK-backed demo runner by importing `scripts/susu-demo-classify.mjs` directly.

### File List

- `.github/workflows/ci.yml`
- `docs/troubleshooting.md`
- `package.json`
- `pnpm-lock.yaml`
- `scripts/susu-demo.mjs`
- `scripts/susu-demo-classify.mjs`
- `scripts/susu-demo.sh`
- `tests/atdd/story-6-10-susu-demo-script.atdd.md`
- `tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`
- `output_susu/implementation-artifacts/6-10-susu-demo-script.md`
- `output_susu/test-artifacts/atdd-checklist-6-10-susu-demo-script.md`
- `output_susu/test-artifacts/test-reviews/story-6-10-test-review.md`
- `output_susu/test-artifacts/code-reviews/story-6-10-code-review.md`
