# IDL Freeze

- Freeze Date: 2026-05-08
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: c18e27587ee22ac2b35453325912dd24f0cbec586729ced96b73a5ef88fd590f
- Justification: Story 3.4 implemented `contribute` with vault PDA wiring, SPL token CPI, `ContributionRecord` participation fields, rotation/window validation, group lifecycle gates, and expanded SusuError variants; `Group` gained rotation-window metadata fields; IDL and Codama outputs were regenerated after `anchor build --ignore-keys` and `pnpm sdk:codegen`.

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
