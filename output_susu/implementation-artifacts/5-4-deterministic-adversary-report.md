# Story 5.4: Byte-deterministic adversary-report.json from --seed $COMMIT_SHA (FR22 part 2 + NFR-Re1)

Status: ready-for-dev

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

- [ ] ATDD red-phase artifacts (AC: 1-6)
  - [ ] Add BDD checklist for Story 5.4
  - [ ] Add static red tests for report determinism, docs, and CI hooks
- [ ] Seed and metadata determinism (AC: 1, 2, 4)
  - [ ] Accept Git commit SHA seeds used by `$COMMIT_SHA` while preserving 64-hex seed support
  - [ ] Ensure `run_metadata.commit_sha` is derived from the explicit seed input, not ambient build/runtime environment
  - [ ] Ensure report-affecting code has no wall-clock, unseeded RNG, process/thread/host, unordered map iteration, or float dependency
- [ ] Stable report contract (AC: 1, 6)
  - [ ] Sort `summary.scenarios_covered` and `per_scenario_results` by stable names before serialization
  - [ ] Keep pretty JSON serialization and a single trailing newline
  - [ ] Add tests that run the binary twice with the same seed and compare bytes
- [ ] Canonical artifact and docs (AC: 2, 5)
  - [ ] Generate `audits/adversary/adversary-report.json`
  - [ ] Add `audits/adversary/README.md` with the reproduction command and verification notes
- [ ] CI/performance guard (AC: 1, 3, 4)
  - [ ] Add a deterministic report check script
  - [ ] Wire the check into CI with a 10-minute budget and cross-run byte comparison

## Dev Notes

### Architecture compliance

- **Path lock:** canonical report path is `audits/adversary/adversary-report.json`.
- **Seed convention:** public docs show `--seed $COMMIT_SHA`. This repository currently uses Git SHA-1 style 40-character commit IDs, so Story 5.4 must support that seed shape in addition to the 64-hex seed accepted by Story 5.2.
- **Report determinism:** all output bytes must be a function of explicit CLI inputs and deterministic simulator state. Do not include wall-clock timestamps, hostnames, process IDs, thread IDs, locale, current directory, or unsorted map/vector output in the report.
- **Scenario ordering:** report arrays must be sorted by stable keys before serialization so adding scenario registration order changes cannot perturb output.

### Testing standards

- `node --test tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs` captures Story 5.4 acceptance expectations.
- `cargo test --package susu-adversary` must include a byte comparison test that shells out to the binary twice with the same seed.
- CI should run the deterministic report check with `--circles 10000` or a documented bounded fallback only if the full run becomes unavailable.

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

### Completion Notes List

### File List

### Change Log

