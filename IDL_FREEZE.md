# IDL Freeze

- Freeze Date: 2026-05-08
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: a349f5aea7e6e2427e58f2bb50c51a0b2b9b407068955b6ea56ecde45f6f08ea
- Justification: Story 4.6 complete_group lifecycle transition for receipt-verified terminal completion; Story 4.4 ContributionPeriodOpen error for strict pre-deadline claim_payout rejection; Story 4.5 AlreadyClaimed error, Story 4.2 claim_payout account surface, RotationReceipt bump, payout guard errors; Story 3.3 PDA collateral vault init on `create_group`, `slash_grace_seconds` on Group, Epic 3 collateral flow (`post_collateral` rotation_slot, permissionless `start_contributions`, `slash_member` rotation_index proportional vault payout, full `withdraw_collateral` CPI signer shape); IDL regenerated from `anchor build`, `pnpm sdk:codegen`.

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
