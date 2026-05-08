# Story 5.4: Byte-deterministic adversary-report.json from --seed $COMMIT_SHA (FR22 part 2 + NFR-Re1)

Status: review

## Story

As an auditor or judge,
I want `cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA` to produce a byte-identical `audits/adversary/adversary-report.json`,
So that the adversary evidence can be independently reproduced from a clean checkout without trusting local machine state.

## Acceptance Criteria

1. Given Stories 5.2 and 5.3 are available, when the adversary binary runs with the same seed on supported runners, then the generated `audits/adversary/adversary-report.json` is byte-identical.
2. Given `--circles 10000 --seed $COMMIT_SHA`, when the full run completes, then `summary.max_defector_profit_lamports == 0` and the process exits 0.
3. The 10,000-circle run completes within 10 minutes on a 4-core baseline, with the CI check documenting the limit.
4. Determinism guard tests fail if report-affecting code uses wall-clock time, unseeded randomness, unordered report iteration, environment/process/thread/host values, or floating-point arithmetic.
5. `audits/adversary/README.md` documents the exact reproduction recipe, the seed convention, report path, and byte-determinism constraints.
6. Report arrays are sorted by stable keys and JSON is emitted with a fixed pretty format plus a trailing newline.

## Tasks / Subtasks

- [x] ATDD red-phase artifacts (AC: 1-6)
  - [x] Add BDD checklist for Story 5.4
  - [x] Add static red tests for report determinism, docs, and CI hooks
- [x] Seed and metadata determinism (AC: 1, 2, 4)
  - [x] Accept Git commit SHA seeds used by `$COMMIT_SHA` while preserving 64-hex seed support
  - [x] Ensure `run_metadata.commit_sha` is derived from the explicit seed input, not ambient build/runtime environment
  - [x] Ensure report-affecting code has no wall-clock, unseeded RNG, process/thread/host, unordered map iteration, or float dependency
- [x] Stable report contract (AC: 1, 6)
  - [x] Sort `summary.scenarios_covered` and `per_scenario_results` by stable names before serialization
  - [x] Keep pretty JSON serialization and a single trailing newline
  - [x] Add tests that run the binary twice with the same seed and compare bytes
- [x] Canonical artifact and docs (AC: 2, 5)
  - [x] Generate `audits/adversary/adversary-report.json`
  - [x] Add `audits/adversary/README.md` with the reproduction command and verification notes
- [x] CI/performance guard (AC: 1, 3, 4)
  - [x] Add a deterministic report check script
  - [x] Wire the check into CI with a 10-minute budget and cross-run byte comparison

## Dev Notes

### Architecture compliance

- **Path lock:** canonical report path is `audits/adversary/adversary-report.json`.
- **Seed convention:** public docs show `--seed $COMMIT_SHA`. This repository currently uses Git SHA-1 style 40-character commit IDs, so Story 5.4 must support that seed shape in addition to the 64-hex seed accepted by Story 5.2.
- **Report determinism:** all output bytes must be a function of explicit CLI inputs and deterministic simulator state. Do not include wall-clock timestamps, hostnames, process IDs, thread IDs, locale, current directory, or unsorted map/vector output in the report.
- **Scenario ordering:** report arrays must be sorted by stable keys before serialization so adding scenario registration order changes cannot perturb output.

### Testing standards

- `node --test tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs` captures Story 5.4 acceptance expectations.
- `cargo test --package susu-adversary` must include a byte comparison test that shells out to the binary twice with the same seed.
- CI runs the deterministic report check with `--circles 10000` and a 600-second budget.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-4-deterministic-adversary-report.md`
- BDD scenarios: `tests/atdd/story-5-4-deterministic-adversary-report.atdd.md`
- Static red test: `tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs`

### References

- `output_susu/test-artifacts/test-design/test-design-epic-5.md` - Story 5.4 test IDs 5.4-E2E-001 through 5.4-INT-006.
- `output_susu/implementation-artifacts/5-2-adversary-cli-skeleton.md` - adversary CLI/report skeleton.
- `output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md` - named scenario required in report coverage.
- `output_susu/implementation-artifacts/dependency-graph.md` - Story 5.4 depends on 5.2 and 5.3.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs` failed in red phase before implementation on missing 40-character seed support, report sorting, deterministic regression test, canonical audit docs/report, and CI guard.
- `node --test tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs` passed after implementation: 5 tests.
- `cargo test --package susu-adversary` passed after implementation.
- `CIRCLES=100 bash scripts/check-adversary-determinism.sh` passed locally; CI runs the same script with the default 10,000 circles.
- `cargo run --bin susu-adversary --release -- --circles 10000 --seed 7438e04cd157a6a76a1d50296ced47cf9a545790 --cluster localnet --output audits/adversary/adversary-report.json` generated the canonical report with `max_defector_profit_lamports == 0`.
- Code review found that canonical artifact reproduction must use the report's recorded seed rather than moving `HEAD`; the README and CI canonical check were updated, and `CHECK_CANONICAL=1 CIRCLES=10000 bash scripts/check-adversary-determinism.sh` passed with the recorded seed.
- Cursor Bugbot found unused build-script commit metadata after report metadata moved to explicit CLI input; `build.rs` was reduced to a no-op source-layout sentinel and `cargo test --package susu-adversary` passed.

### Completion Notes List

- Added commit-style 40-character seed support by validating the hex commit ID and deterministically expanding it to a 32-byte ChaCha20 seed with Solana's stable hash function; 64-hex direct seed input remains supported.
- Changed report `commit_sha` metadata to come from the explicit `--seed` input so canonical report bytes do not depend on build environment state.
- Sorted scenario coverage and per-scenario result arrays by stable names before serialization.
- Added a Rust integration test that shells out to the binary twice with the same commit-style seed and compares report bytes.
- Added audit reproduction docs, committed the canonical adversary report, and wired a CI determinism script with a 10-minute budget.
- Addressed code review by documenting the self-referential commit-seed constraint and adding a CI canonical-artifact byte comparison mode.
- Addressed Cursor Bugbot by removing unused `SUSU_ADVERSARY_BUILD_COMMIT` emission from `build.rs`.

### File List

- `.github/workflows/ci.yml`
- `audits/adversary/README.md`
- `audits/adversary/adversary-report.json`
- `crates/susu-adversary/README.md`
- `crates/susu-adversary/build.rs`
- `crates/susu-adversary/src/main.rs`
- `crates/susu-adversary/src/simulator.rs`
- `crates/susu-adversary/tests/deterministic_report.rs`
- `output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md`
- `output_susu/test-artifacts/atdd-checklist-5-4-deterministic-adversary-report.md`
- `output_susu/test-artifacts/code-reviews/story-5-4-code-review.md`
- `scripts/check-adversary-determinism.sh`
- `tests/atdd/story-5-4-deterministic-adversary-report.atdd.md`
- `tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs`

### Change Log

- 2026-05-08: Added ATDD red artifacts for Story 5.4.
- 2026-05-08: Implemented byte-deterministic adversary report generation, canonical audit artifact/docs, deterministic regression tests, and CI guard; marked story ready for review.
- 2026-05-08: Addressed code review finding by making canonical artifact reproduction use the report's recorded seed and adding a CI byte comparison against the committed report.
- 2026-05-08: Addressed Cursor Bugbot finding by making the adversary crate build script a no-op sentinel.
