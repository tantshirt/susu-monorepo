# IDL Freeze

- Freeze Date: 2026-05-08
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: 6fb1f7b68e1e6cdc57e358205c6ff20d4166f6147a7f5153ac31caf7f094d1ba
- Justification: Story 3.5 `top_up_collateral` + read-only `group` account in instruction layout (`InsufficientCollateral`, Epic 3 curve + `contribute`); IDL regenerated (`anchor build --ignore-keys`, `pnpm sdk:codegen`).

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
