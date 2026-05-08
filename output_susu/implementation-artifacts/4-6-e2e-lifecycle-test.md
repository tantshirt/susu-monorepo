# Story 4.6: E2E lifecycle test

## Status

Done in PR #162 (`story-4.6-e2e-lifecycle-test`).

## Scope

Story 4.6 adds the Epic 4 lifecycle capstone coverage for deterministic rotation assignment, funded rotation claims, non-recipient rejection, strict deadline rejection, duplicate-claim receipt isolation, explicit group completion, and collateral withdrawal terminal state.

## Artifacts

- `tests/atdd/story-4-6-e2e-lifecycle-test.atdd.md`
- `tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs`
- `programs/susu/tests/full_lifecycle.rs`
- `programs/susu/src/instructions/complete_group.rs`
- `tests/coverage/threat-model.md`

## Notes

Surfpool remains environment-gated while `docs/surfpool-status.md` reports `LiteSVM-fallback`. The committed local gate is the Rust/static fallback lifecycle test until a supported Surfpool host records the final transcript.
