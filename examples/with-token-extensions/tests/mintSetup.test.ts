import { describe, expect, it } from 'vitest';
import { address } from '@solana/kit';
import { TOKEN_2022_PROGRAM_ADDRESS, Token2022Instruction, identifyToken2022Instruction } from '@solana-program/token-2022';
import { createSusuClient, contribute, postCollateral, solanaDevnetRpc } from '@susu/sdk';

import {
  buildToken2022MintPlan,
  permanentDelegateMatches,
  token2022TransferAccounts,
} from '../src/mintSetup.js';

const mint = address('So11111111111111111111111111111111111111112');
const authority = address('11111111111111111111111111111111');
const hookProgram = address('noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV');
const delegate = address('SysvarRent111111111111111111111111111111111');

describe('Token-2022 mint setup', () => {
  it('builds TransferHook, MetadataPointer, and PermanentDelegate mint instructions', async () => {
    const plan = await buildToken2022MintPlan({ mint, mintAuthority: authority, transferHookProgram: hookProgram, permanentDelegate: delegate });

    expect(plan.tokenProgram).toBe(TOKEN_2022_PROGRAM_ADDRESS);
    expect(plan.extensions.map((item) => item.__kind)).toEqual(['TransferHook', 'MetadataPointer', 'PermanentDelegate']);
    expect(plan.mintSize).toBeGreaterThan(82);
    expect(plan.instructions.map((ix) => identifyToken2022Instruction(ix as never))).toEqual([
      Token2022Instruction.InitializeTransferHook,
      Token2022Instruction.InitializeMetadataPointer,
      Token2022Instruction.InitializePermanentDelegate,
      Token2022Instruction.InitializeMint,
    ]);
  });

  it('derives and threads the Transfer Hook extra-account PDA', async () => {
    const plan = await buildToken2022MintPlan({ mint, mintAuthority: authority, transferHookProgram: hookProgram, permanentDelegate: delegate });
    const accounts = token2022TransferAccounts(plan, authority, delegate, authority);

    expect(plan.transferHook.programId).toBe(hookProgram);
    expect(plan.transferHook.bump).toBeGreaterThanOrEqual(0);
    expect(accounts.payer).toBe(authority);
    expect(accounts.collateralVault).toBe(delegate);
    expect(accounts.contributor).toBe(authority);
    expect(accounts.vault).toBe(delegate);
    expect(accounts.transferHookExtraAccounts).toBe(plan.transferHook.extraAccountMetaList);
  });

  it('checks Permanent Delegate authority without exercising force transfer', async () => {
    const plan = await buildToken2022MintPlan({ mint, mintAuthority: authority, transferHookProgram: hookProgram, permanentDelegate: delegate });

    expect(permanentDelegateMatches(plan, delegate)).toBe(true);
    expect(permanentDelegateMatches(plan, authority)).toBe(false);
  });

  it('passes Token-2022 program and hook accounts through Susu postCollateral and contribute helpers', async () => {
    const calls: unknown[] = [];
    const rpc = {
      getPriorityFeeEstimate: () => ({ priorityFeeEstimate: 0 }),
      simulateTransaction: () => ({ value: { err: null } }),
      sendTransaction: (tx: unknown) => {
        calls.push(tx);
        return { signature: 'sig' };
      },
    };
    const client = createSusuClient({ cluster: 'devnet' }).use(solanaDevnetRpc({ rpc }));
    const plan = await buildToken2022MintPlan({ mint, mintAuthority: authority, transferHookProgram: hookProgram, permanentDelegate: delegate });
    const hookAccounts = token2022TransferAccounts(plan, authority, delegate, authority);

    await postCollateral(client, { accounts: { group: mint, member: authority, memberPosition: authority, ...hookAccounts }, amount: 1n });
    await contribute(client, { accounts: { group: mint, member: authority, memberPosition: authority, ...hookAccounts }, amount: 1n });

    const serialized = JSON.stringify(calls, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
    expect(serialized).toContain(TOKEN_2022_PROGRAM_ADDRESS);
    expect(serialized).toContain(plan.transferHook.extraAccountMetaList);
  });
});
