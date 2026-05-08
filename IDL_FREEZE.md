# IDL Freeze

- Freeze Date: 2026-05-08
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: 0ead61facd4bc724fcf058152b510c1c5607caebe96851137e4559a18e232c6f
- Justification: Story 3.3 PDA collateral vault init on `create_group`, `slash_grace_seconds` on Group, Epic 3 collateral flow (`post_collateral` rotation_slot, permissionless `start_contributions`, `slash_member` rotation_index proportional vault payout, full `withdraw_collateral` CPI signer shape); IDL regenerated from `anchor build`, `pnpm sdk:codegen`.

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
