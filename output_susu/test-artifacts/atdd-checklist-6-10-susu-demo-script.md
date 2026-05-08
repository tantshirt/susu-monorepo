---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-09'
storyId: '6.10'
storyKey: 6-10-susu-demo-script
storyFile: output_susu/implementation-artifacts/6-10-susu-demo-script.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-6-10-susu-demo-script.md
generatedTestFiles:
  - tests/atdd/story-6-10-susu-demo-script.atdd.md
  - tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs
---

# ATDD Checklist: Story 6.10 `pnpm susu:demo`

## Inputs

- Story file: `output_susu/implementation-artifacts/6-10-susu-demo-script.md`
- Detected stack: fullstack repository with Node, Rust, Anchor, and shell CI orchestration
- Generation mode: AI-generated static acceptance tests, matching existing `tests/atdd/*.static.red.test.mjs` patterns

## Acceptance Mapping

| AC | Priority | Test Level | Coverage |
| --- | --- | --- | --- |
| AC1 complete mock ROSCA cycle | P0 | Static + runner parse | `scripts/susu-demo.sh` delegates to `scripts/susu-demo.mjs`; runner calls SDK lifecycle helpers for 5 members and 5 rounds |
| AC2 structured colored output | P1 | Static | Shell/runner output helpers, phase markers, tx signatures, Solscan links |
| AC3 <=60s budget | P0 | Static + shell syntax | `SUSU_DEMO_MAX_SECONDS` default 60 and shell assertion on final wall clock |
| AC4 failure buckets | P0 | Static | `rpc-reachability`, `devnet-airdrop-limit`, `dependency-mismatch`, and `performance-budget` hints with docs anchors |
| AC5 Surfpool CI smoke | P0 | Static | `.github/workflows/ci.yml` starts `surfpool start --network devnet --port 8899` and runs `pnpm susu:demo` against the fork |

## Generated Red Tests

- `tests/atdd/story-6-10-susu-demo-script.atdd.md`
- `tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`

## Red Phase Expectation

These tests fail before implementation because `package.json` still points `susu:demo` at the placeholder command and neither `scripts/susu-demo.sh`, `scripts/susu-demo.mjs`, nor `docs/troubleshooting.md` exists.

## Handoff

Proceed to implementation by creating the shell orchestrator, SDK-backed runner, troubleshooting docs, package script, and Surfpool CI job. Keep runtime smoke deterministic by allowing a local mock sender while preserving devnet/Surfpool endpoint checks and transaction-shaped output.
