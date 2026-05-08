# Threat Model Coverage

This matrix is the Story 5.6 evidence contract for `docs/threat-model.md`. Each row maps a documented attack to a mitigation claim and one or more repository paths that already exist. Do not cite future Epic 5 artifacts here until they have landed.

Story 4.6 records the FR20 pull-based payout lifecycle coverage. The local fallback capstone is `programs/susu/tests/full_lifecycle.rs`, and the static guard is `tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs`. Surfpool remains environment-gated while `docs/surfpool-status.md` reports `LiteSVM-fallback`; full Surfpool acceptance requires a later transcript on a supported host.

| attack | mitigation | test_file_path |
| --- | --- | --- |
| strategic-default curve collateral | Canonical curve and golden fixtures verify collateral requirements across supported group sizes. | programs/susu/tests/curve.rs |
| strategic-default exact funding | Payout requires every accepted member to have paid the exact rotation contribution before transfer. | programs/susu/tests/claim_payout.rs |
| late-position-cartel 30% Cartel component evidence | Current evidence covers curve collateral, deterministic slots, exact funding, and lifecycle completion while the named Story 5.3 30% Cartel simulator remains residual risk. | programs/susu/tests/full_lifecycle.rs |
| late-position-cartel curve gate | Late-position risk is bounded by required collateral from the canonical curve before group activation. | programs/susu/tests/curve.rs |
| claim-dos permissionless pull | Claim execution is a signed pull transaction with recipient, deadline, funding, and replay guards before vault transfer. | programs/susu/tests/claim_payout.rs |
| claim-dos no scheduler dependency | The lifecycle remains pull-based and scheduler-free for claim, completion, and withdrawal. | tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs |
| pda-collision receipt isolation | Rotation receipts are seeded by group and little-endian rotation index, isolating each group rotation. | programs/susu/tests/claim_payout.rs |
| pda-collision rotation assignment domain separation | Rotation assignment is byte-reproducible and domain-separated by group PDA. | programs/susu/tests/rotation_assignment.rs |
| unsafe-deserialization remaining accounts | Claim funding verification rejects non-program-owned, wrong-PDA, wrong-group, wrong-member, and wrong-amount member positions. | programs/susu/tests/claim_payout.rs |
| custodial-path vault authority | Vault transfers use the group PDA signer and member-owned token accounts, without admin transfer authority. | programs/susu/tests/claim_payout.rs |
| custodial-path terminal balances | Full lifecycle fallback models all receipts and zero terminal collateral/vault balances. | programs/susu/tests/full_lifecycle.rs |
| scheduler-keeper introduction | Static ATDD coverage rejects scheduler, keeper, cron, automation, executor, bot, Chainlink, and Clockwork dependency tokens in the payout lifecycle. | tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs |
| scheduler-keeper pull lifecycle | Full lifecycle fallback exercises claim, complete, and withdraw as explicit transactions instead of keeper-driven settlement. | programs/susu/tests/full_lifecycle.rs |
| double-claim receipt guard | Anchor receipt initialization rejects duplicate claims before a second vault transfer path can execute. | tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs |
