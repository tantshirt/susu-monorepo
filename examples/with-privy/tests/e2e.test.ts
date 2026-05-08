import { describe, expect, it } from 'vitest';
import { runPrivySusuDemo } from '../src/index.js';

const fakePrivy = (caip2s: string[] = []) => {
  let counter = 0;
  return {
    wallets: () => ({
      create: async ({ chain_type }: { chain_type: string }) => ({
        id: `wallet-${++counter}`,
        address: '11111111111111111111111111111111',
        chain_type,
      }),
      solana: () => ({
        signAndSendTransaction: async (walletId: string, input: { caip2: string }) => ({
          hash: Buffer.from(`${walletId}-createGroup-acceptInvite-postCollateral-contribute`).toString('base64'),
          caip2: caip2s.push(input.caip2),
        }),
      }),
    }),
  };
};

describe('with-privy mocked happy path', () => {
  it('runs createGroup, acceptInvite, postCollateral, and contribute with Privy signers', async () => {
    const lines: string[] = [];
    const result = await runPrivySusuDemo({
      privy: fakePrivy() as never,
      env: {
        CLUSTER: 'devnet',
        HELIUS_RPC_URL: 'https://example.invalid/devnet',
        SUSU_GROUP_ID: '6606',
      },
      log: (line) => lines.push(line),
    });

    expect(result.members).toHaveLength(3);
    expect(result.signatures.map((entry) => entry.step).join(' ')).toMatch(/createGroup[\s\S]*acceptInvite[\s\S]*postCollateral[\s\S]*contribute/);
    expect(lines.some((line) => line.includes('Privy wallet'))).toBe(true);
  });

  it('uses the testnet CAIP-2 identifier when CLUSTER=testnet', async () => {
    const caip2s: string[] = [];
    await runPrivySusuDemo({
      privy: fakePrivy(caip2s) as never,
      env: { CLUSTER: 'testnet', HELIUS_RPC_URL: 'https://example.invalid/testnet' },
      log: () => undefined,
    });

    expect(new Set(caip2s)).toEqual(new Set(['solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z']));
  });
});

const env = process.env;

(env.PNPM_TEST_E2E === '1' ? describe : describe.skip)('with-privy live e2e', () => {
  it('uses live Privy credentials and devnet RPC when explicitly enabled', async () => {
    const result = await runPrivySusuDemo();
    expect(result.signatures.length).toBeGreaterThanOrEqual(10);
  });
});
