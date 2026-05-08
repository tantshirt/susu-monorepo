import { env } from 'node:process';
import { describe, expect, it } from 'vitest';

import { runToken2022SusuDemo } from '../src/index.js';

const describeIfE2e = env.PNPM_TEST_E2E === '1' ? describe : describe.skip;

describeIfE2e('Token-2022 Susu example happy path', () => {
  it('runs the mint, group, collateral, and contribution flow with hook PDA and Permanent Delegate checks', async () => {
    const summary = await runToken2022SusuDemo();

    expect(summary.signatures).toHaveLength(9);
    expect(summary.mintPlan.extensions.map((item) => item.__kind)).toEqual([
      'TransferHook',
      'MetadataPointer',
      'PermanentDelegate',
    ]);
    expect(summary.mintPlan.transferHook.extraAccountMetaList).toBeTruthy();
    expect(summary.permanentDelegateOk).toBe(true);
  });
});
