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

This repository still does not have a committed LiteSVM transaction fixture. Story 2.2 development added `programs/susu/tests/happy_path.rs`, but that file is a compile/unit proxy rather than a LiteSVM harness: it does not load the compiled BPF/SBF program, submit a signed transaction, pay rent through the system program, decode the initialized `Group` account from runtime state, capture runtime logs, or assert duplicate PDA creation through a real runtime error. Per the Epic 2 design, Surfpool remains deferred and LiteSVM is the fallback. Until the transaction fixture exists, runtime coverage is intentionally limited and strengthened through static plus Rust unit proxy tests.

## Acceptance Criteria Coverage

| AC | Coverage | Test |
| --- | --- | --- |
| AC1 deterministic Group PDA and decoded fields | Static checks require Anchor `init`, seeds `[GROUP_SEED, creator, group_id]`, creator signer, `Group::INIT_SPACE`, and exact field assignment. | `[P0] create_group account constraints...`, `[P0] create_group initializes exact Group fields...` |
| AC2 n bounds 3..12 | Static check requires `require!(n >= 3 && n <= 12, SusuError::InvalidMemberCount)`. | `[P0] create_group validates n bounds...` |
| AC3 supported USDC/USDT allowlist | Static check requires `constants.rs`, four mint constants, canonical USDC addresses, and `is_supported_mint`; Rust proxy checks all four allowlisted mints plus unsupported/default mints. | `[P0] supported USDC and USDT allowlist...`, `test_create_group_accepts_all_allowlisted_mints`, `test_create_group_rejects_default_pubkey_mint` |
| AC4 creator-paid rent/init | Static check requires `creator: Signer`, `payer = creator`, `system_program`, and Anchor `init`. | `[P0] create_group account constraints...` |
| AC5 group_created log/event | Static check requires `msg!("group_created ...")` with group_pda, creator, n, mint, and group_id. | `[P0] create_group initializes exact Group fields...` |
| AC6 LiteSVM happy path | Runtime LiteSVM transaction coverage is blocked by the missing committed transaction fixture; Rust proxy requires `test_create_group_happy_path`, deterministic PDA derivation, bounds, all allowlisted mints, and `group_created` log contract markers. | `[P1] LiteSVM acceptance coverage...`, `programs/susu/tests/happy_path.rs` |
| AC7 LiteSVM negative paths | Runtime LiteSVM transaction coverage is blocked by the missing committed transaction fixture; Rust proxy requires invalid n, unsupported/default mint, and duplicate create semantics plus exact error terms. | `[P1] LiteSVM acceptance coverage...`, `programs/susu/tests/happy_path.rs` |
| Scope guard | Static and Rust proxy checks require `create_group` to remain metadata-only with no token custody, fee, yield, transfer, CPI, vault, or token-account behavior. | `[P0] create_group remains metadata-only...`, `test_create_group_has_no_token_custody_fee_or_yield_proxy` |
| AC8 CI `cargo test -p susu` | Checklist flags runtime harness as development-step work; ATDD branch validates only lightweight static scaffolding. | This checklist |

## Red Test Expectations

On the ATDD red commit (`f5f7c88`), `main` had a stub `create_group` handler and no committed LiteSVM harness, so the Story 2.2 red tests were expected to fail before implementation. After development commit `963cbaf`, static and Rust proxy tests are expected to pass, but full LiteSVM transaction coverage remains blocked by the missing fixture described below.

## Step 3 Develop Handoff

1. Implement only Story 2.2 production code needed to satisfy these tests.
2. Add a committed LiteSVM transaction fixture that loads the compiled `susu` program, builds and signs a real `create_group` instruction, funds the creator, invokes the system-program `init`, decodes the resulting `Group` account, captures `group_created` logs, and asserts duplicate PDA creation through the runtime error path.
3. Activate `cargo test -p susu` in the story PR once the runtime harness compiles.
4. Keep Surfpool out of the Epic 2 critical path until repo docs prove it is ready.

## Validation

- On `f5f7c88`, `node --test tests/atdd/story-2.2-create-group.static.red.test.mjs` should fail red on the stub.
- After `963cbaf`, `node --test tests/atdd/story-2.2-create-group.static.red.test.mjs` and `RUSTUP_TOOLCHAIN=stable cargo test -p susu --test happy_path` should pass.
- `cargo test -p susu` is still not sufficient for runtime acceptance until the LiteSVM transaction fixture is committed.

## Test Review Follow-Up

- Missing fixture: a committed LiteSVM/Solana runtime test fixture for `programs/susu/tests/happy_path.rs` or a sibling integration test module that can load the compiled program artifact and execute `create_group` as an actual transaction.
- Required helper capabilities: deterministic program loader, payer/creator lamport funding, PDA account creation via Anchor `init`, instruction data/account meta construction for `create_group`, account decode helper for `Group`, transaction log capture, and exact error extraction for invalid n, unsupported mint, and duplicate create.
- Current mitigation: static ATDD checks plus Rust compile/unit proxy coverage guard the public contract, supported mint allowlist, n bounds, deterministic PDA derivation, duplicate PDA semantics, metadata-only scope, and required log marker until the runtime fixture is available.
