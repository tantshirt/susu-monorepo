import { describe, expect, it } from 'vitest';
import { run } from '../src/index.js';

const env = process.env as Record<string, string | undefined>;
const e2eDescribe = env.PNPM_TEST_E2E === '1' ? describe : describe.skip;

e2eDescribe('with-squads e2e', () => {
  it('runs the multisig-as-creator happy path', async () => {
    const result = await run();

    expect(result.verifiedCreator).toBe(result.multisigPda);
    expect(result.signature).toMatch(/^squads-/);
  }, 120_000);
});
