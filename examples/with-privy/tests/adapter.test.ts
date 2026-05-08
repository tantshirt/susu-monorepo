import { describe, expect, it } from 'vitest';
import { createPrivySusuSigner, type PrivySolanaApi } from '../src/privyAdapter.js';

describe('createPrivySusuSigner', () => {
  it('wraps a Privy Solana wallet as a kit TransactionSigner', async () => {
    const calls: unknown[] = [];
    const solana: PrivySolanaApi = {
      signAndSendTransaction: async (walletId, input) => {
        calls.push({ walletId, input });
        return { hash: Buffer.from('signed-by-privy').toString('base64') };
      },
    };
    const signer = createPrivySusuSigner({
      wallet: { id: 'wallet-1', address: '11111111111111111111111111111111' },
      solana,
      caip2: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    });

    const signature = await signer.signSusuPayload({ helper: 'createGroup' });
    const [bytes] = await (signer as typeof signer & {
      signAndSendTransactions(transactions: readonly unknown[]): Promise<readonly Uint8Array[]>;
    }).signAndSendTransactions([{ messageBytes: new Uint8Array([1]) }]);

    expect(signer.walletId).toBe('wallet-1');
    expect(signer.address).toBe('11111111111111111111111111111111');
    expect(signature).toBe(Buffer.from('signed-by-privy').toString('base64'));
    expect(bytes).toHaveLength(64);
    expect(calls).toHaveLength(2);
  });
});
