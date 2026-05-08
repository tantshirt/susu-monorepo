import { describe, expect, it } from 'vitest';
import { runPrivySusuDemo } from '../src/index.js';

const fakePrivy = () => {
  let counter = 0;
  return {
    wallets: () => ({
      create: async ({ chain_type }: { chain_type: string }) => ({
        id: `wallet-${++counter}`,
        address: '11111111111111111111111111111111',
        chain_type,
      }),
      solana: () => ({
        signAndSendTransaction: async (walletId: string) => ({
          hash: Buffer.from(`${walletId}-createGroup-acceptInvite-postCollateral-contribute`).toString('base64'),
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
});

const env = process.env;

(env.PNPM_TEST_E2E === '1' ? describe : describe.skip)('with-privy live e2e', () => {
  it('uses live Privy credentials and devnet RPC when explicitly enabled', async () => {
    const result = await runPrivySusuDemo();
    expect(result.signatures.length).toBeGreaterThanOrEqual(10);
  });
});
