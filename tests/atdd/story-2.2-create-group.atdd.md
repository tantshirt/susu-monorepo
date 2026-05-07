---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-07
storyId: "2.2"
storyKey: story-2.2-create-group
storyFile: output_susu/implementation-artifacts/2-2-create-group.md
atddChecklistPath: tests/atdd/story-2.2-create-group.atdd.md
generatedTestFiles:
  - tests/atdd/story-2.2-create-group.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/2-2-create-group.md
  - output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md
  - programs/susu/src/instructions/create_group.rs
  - programs/susu/src/state/group.rs
  - programs/susu/src/error.rs
---

# ATDD Checklist: Story 2.2 create_group

## TDD Red Phase

Red-phase static acceptance tests are generated in `tests/atdd/story-2.2-create-group.static.red.test.mjs`.

This repository does not yet have a committed LiteSVM runtime fixture or `programs/susu/tests/` harness on updated `main`. Per the Epic 2 design, Surfpool remains deferred and LiteSVM is the fallback. Runtime coverage is therefore represented by an intentional static red test that requires `programs/susu/tests/happy_path.rs` to exist with the named LiteSVM scenarios once the development step adds the harness.

## Acceptance Criteria Coverage

| AC | Coverage | Test |
| --- | --- | --- |
| AC1 deterministic Group PDA and decoded fields | Static checks require Anchor `init`, seeds `[GROUP_SEED, creator, group_id]`, creator signer, `Group::INIT_SPACE`, and exact field assignment. | `[P0] create_group account constraints...`, `[P0] create_group initializes exact Group fields...` |
| AC2 n bounds 3..12 | Static check requires `require!(n >= 3 && n <= 12, SusuError::InvalidMemberCount)`. | `[P0] create_group validates n bounds...` |
| AC3 supported USDC/USDT allowlist | Static check requires `constants.rs`, four mint constants, canonical USDC addresses, and `is_supported_mint`. | `[P0] supported USDC and USDT allowlist...` |
| AC4 creator-paid rent/init | Static check requires `creator: Signer`, `payer = creator`, `system_program`, and Anchor `init`. | `[P0] create_group account constraints...` |
| AC5 group_created log/event | Static check requires `msg!("group_created ...")` with group_pda, creator, n, mint, and group_id. | `[P0] create_group initializes exact Group fields...` |
| AC6 LiteSVM happy path | Static red test requires `programs/susu/tests/happy_path.rs` with `test_create_group_happy_path`. | `[P1] LiteSVM acceptance coverage...` |
| AC7 LiteSVM negative paths | Static red test requires invalid n, unsupported mint, and duplicate create test names plus exact error terms. | `[P1] LiteSVM acceptance coverage...` |
| AC8 CI `cargo test -p susu` | Checklist flags runtime harness as development-step work; ATDD branch validates only lightweight static scaffolding. | This checklist |

## Red Test Expectations

Current `main` has a stub `create_group` handler and no committed LiteSVM harness, so the Story 2.2 red tests are expected to fail before implementation. The failures are intentional ATDD signal, not a blocker for Step 3 Develop.

## Step 3 Develop Handoff

1. Implement only Story 2.2 production code needed to satisfy these tests.
2. Add LiteSVM/Anchor runtime tests in `programs/susu/tests/happy_path.rs`.
3. Activate `cargo test -p susu` in the story PR once the runtime harness compiles.
4. Keep Surfpool out of the Epic 2 critical path until repo docs prove it is ready.

## Validation

- `node --test tests/atdd/story-2.2-create-group.static.red.test.mjs` should fail red on the current stub.
- `npm run test:atdd` should fail red because Story 2.2 is not implemented yet.
- `cargo test -p susu` may pass or fail independently of this ATDD branch; it is not sufficient until the LiteSVM story tests are added.
