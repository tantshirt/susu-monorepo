# Story 6.5 SDK Parity CI Check

## Acceptance Criteria

### Scenario: CI rejects generated SDK drift

Given the repository contains generated TypeScript and Rust SDK output
When `bash scripts/check-sdk-parity.sh` runs in CI
Then it must run `pnpm sdk:codegen`
And it must fail if `sdk/ts/src/generated` or `sdk/rust/src/generated` has uncommitted drift after regen.

### Scenario: CI compares TypeScript and Rust generated surfaces

Given Codama generates TypeScript instruction builders and Rust `SusuInstructionKind`
When the parity checker extracts both generated surfaces
Then it must compare instruction, account, and error name sets
And it may normalize only instruction names by mapping Rust enum variants to TS camelCase exports
And account and error names must match exactly.

### Scenario: parity failures are readable

Given the TypeScript and Rust generated surfaces differ
When the parity checker fails
Then `compare-sdk-surfaces.mjs` must list symbols only in TS vs only in Rust per category.
