# IDL Freeze

- Freeze Date: 2026-05-08
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: ad2adc52ef50e99e0b30a4cddd8fed968143c326fe1af404550e31a4428d8fb5
- Justification: Story 3.5 `top_up_collateral` + `InsufficientCollateral`; rebased on Epic 3 curve and `contribute`; IDL and Codama outputs regenerated (`anchor build --ignore-keys`, `pnpm sdk:codegen`).

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
