---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '5.3'
storyKey: 5-3-thirty-percent-cartel-scenario
storyFile: output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md
atddChecklistPath: output_susu/test-artifacts/atdd-checklist-5-3-thirty-percent-cartel-scenario.md
generatedTestFiles:
  - tests/atdd/story-5-3-thirty-percent-cartel-scenario.atdd.md
  - tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs
---

# ATDD Checklist: Story 5.3 30% Cartel Scenario

## TDD Red Phase

Red-phase acceptance scaffolds were generated from the Story 5.3 acceptance criteria and the existing Story 5.2 adversary CLI skeleton.

- Static ATDD tests: `tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs`
- BDD scenario notes: `tests/atdd/story-5-3-thirty-percent-cartel-scenario.atdd.md`
- Story handoff: `output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md`

## Preflight and Context

- Detected stack: fullstack/backend Rust workspace with Node ATDD harness.
- Story file: created for Story 5.3 because `origin/main` had the sprint-status key but not the story artifact.
- Framework patterns: existing `tests/atdd/*.red.test.mjs` active static tests, `cargo test --package susu-adversary`, and Story 5.2 adversary crate layout.
- Knowledge fragments applied: component TDD, test quality, test levels, determinism and isolation guidance.
- CLI sessions cleaned up: N/A, no browser automation used.

## Generation Mode

Sequential AI generation was used. This story has no UI journey or HTTP API endpoint; the repository convention for adversary stories is active Node static red tests plus Rust unit tests.

## Acceptance Criteria Coverage

| AC | Coverage |
| --- | --- |
| AC1 named module and setup | Static checks require `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`, the required `run` signature, a 10-member circle, rotations 0-3 funded, and default at rotation 4 by members 4-6. |
| AC2 scenario assertions | Static checks require honest-member made-whole, defector net-negative, and no-admin-intervention assertion helpers, and reject admin shortcut names. |
| AC3 simulator registration | Static checks require `all_scenarios() -> Vec<Scenario>`, the literal `"30_percent_cartel"`, simulator registry iteration, `scenarios_covered`, and `per_scenario_results`. |
| AC4 README handoff | Static checks require the crate README to name `30% Cartel` for the Epic 8 root README badge-cluster handoff. |
| AC5 unit tests | Static checks require `crates/susu-adversary/tests/thirty_percent_cartel.rs` to test setup through rotation 3 and a synthetic defector-profit assertion failure. |

## Red-Green Activation

The generated static test intentionally fails before implementation because the scenario module, registry, library surface, README hook, and scenario unit tests do not exist yet.

Run the red-phase check:

```sh
node --test tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs
```

Green-phase implementation should then run:

```sh
pnpm test:atdd
cargo test --package susu-adversary
```

## Implementation Guidance

- Keep the path lock: `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`.
- Export a public library surface from the crate so `crates/susu-adversary/tests/thirty_percent_cartel.rs` can exercise scenario setup without shelling out to the binary.
- Preserve determinism: the only randomness source should be the seeded `&mut ChaCha20Rng`.
- Keep the full CLI report path wired through the scenario registry so Story 5.4 can make the canonical report byte-deterministic.
- Do not edit the root README in this story; add the crate README TODO handoff for Epic 8.

## Validation

- Prerequisites satisfied: Story 5.2 CLI skeleton is merged in `origin/main` and available at `crates/susu-adversary`.
- Test files created correctly: yes.
- Checklist matches acceptance criteria: yes.
- Red-phase behavior: active static red tests follow the repository convention used by Story 5.2.
- Temp artifacts stored in story test artifacts: yes.
- Next workflow: `bmad-dev-story` for Story 5.3 implementation.
