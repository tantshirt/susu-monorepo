# IDL Freeze

- Freeze Date: 2026-05-06
- Program: susu
- Program ID: 2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N
- IDL Path: programs/susu/idl/susu.json
- SHA-256: fb68f900f66cc034b4f33f5988326f2df342c6b871760e5da0732c3a7ee095ce
- Justification: Story 2.4 finalized the `accept_invite` instruction surface with member-paid `MemberPosition` initialization, member signer, and system program accounts; the update is logged in `log/2026-05-07.md`.

## Freeze Policy

The IDL is treated as a frozen interface artifact for downstream SDK/codegen/audit workflows.
Any future IDL change must be accompanied by a public engineering-log justification and a hash update in this file.
