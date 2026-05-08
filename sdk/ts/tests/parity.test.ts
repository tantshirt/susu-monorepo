import { describe, expect, it } from 'vitest';

// Story 6.4 PDA parity vector. Story 6.5 wires this into a live cross-language
// parity runner; for now the TS side pins the same constants as the Rust test.
const EXPECTED_GROUP_PDA = 'BgFLM8vhfSSpAxpKaxczPyucae8F96Jtg2f4ib851Zx9';
const EXPECTED_GROUP_BUMP = 252;
const EXPECTED_MEMBER_PDA = 'DDkjBd4gxjx3ZgtNdL9PNioU8fEZfs2KbFsJipVuE1yw';
const EXPECTED_MEMBER_BUMP = 248;

describe.skip('Story 6.5 Rust/TS SDK parity', () => {
  it('will compare generated instruction inputs against the Rust SDK', () => {
    expect(EXPECTED_GROUP_PDA).toBeTruthy();
    expect(EXPECTED_GROUP_BUMP).toBeGreaterThanOrEqual(0);
    expect(EXPECTED_MEMBER_PDA).toBeTruthy();
    expect(EXPECTED_MEMBER_BUMP).toBeGreaterThanOrEqual(0);
  });
});
