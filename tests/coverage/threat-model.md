# Threat Model Coverage

## FR20 Pull-Based Payout Lifecycle

Story 4.6 records the Epic 4 capstone coverage for FR20. The local fallback capstone is `programs/susu/tests/full_lifecycle.rs`, which models create, invite, accept, collateral posting, deterministic start assignment, per-rotation contributions, permissionless claims, explicit completion, and collateral withdrawal.

The structural static check is `tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs`. It verifies that Story 4.6 coverage derives claim recipients from realized `rotation_slot` state, checks every `RotationReceipt`, asserts terminal collateral and vault balances reach zero, and keeps payout execution pull-based rather than delegated to any external timing service.

Surfpool remains environment-gated while `docs/surfpool-status.md` reports `LiteSVM-fallback`. Full Surfpool acceptance requires a later transcript on a supported host.
