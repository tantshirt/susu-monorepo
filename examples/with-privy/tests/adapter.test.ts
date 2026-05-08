import { describe, expect, it } from 'vitest';
import bs58 from 'bs58';
import { createPrivySusuSigner, type PrivySolanaApi } from '../src/privyAdapter.js';

describe('createPrivySusuSigner', () => {
  it('wraps a Privy Solana wallet as a kit TransactionSigner', async () => {
    const calls: unknown[] = [];
    const signatureBytes = new Uint8Array(64).fill(7);
    const privySignature = bs58.encode(signatureBytes);
    const solana: PrivySolanaApi = {
      signAndSendTransaction: async (walletId, input) => {
        calls.push({ walletId, input });
        return { hash: privySignature };
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
    expect(signature).toBe(privySignature);
    expect(bytes).toEqual(signatureBytes);
    expect(calls).toHaveLength(2);
  });

  it('rejects Privy transaction responses without a signature', async () => {
    const signer = createPrivySusuSigner({
      wallet: { id: 'wallet-1', address: '11111111111111111111111111111111' },
      solana: { signAndSendTransaction: async () => ({}) },
      caip2: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    });

    await expect(signer.signSusuPayload({ helper: 'createGroup' })).rejects.toThrow('transaction signature');
  });
});
