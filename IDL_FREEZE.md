# IDL Freeze

- Freeze Date: 2026-05-06
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: fd73c6c0f9af6872546328b27965ee848d39d813e7191d73ba7541333bf8ac43
- Justification: Story 2.3 finalized the `invite_members` instruction surface and persisted `Group.bump` for canonical PDA account constraints; the update is logged in `log/2026-05-07.md`.

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
