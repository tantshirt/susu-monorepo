import { Buffer } from 'node:buffer';
import { address, signatureBytes, type Address, type SignatureBytes, type TransactionSigner } from '@solana/kit';

export type PrivySolanaWallet = Readonly<{ id: string; address: string }>;

export type PrivySolanaApi = Readonly<{
  signAndSendTransaction?: (
    walletId: string,
    input: Readonly<{ caip2: string; transaction: string }>,
  ) => Promise<Readonly<{ hash?: string; signature?: string }>>;
  signMessage?: (
    walletId: string,
    input: Readonly<{ message: string }>,
  ) => Promise<Readonly<{ signature: string }>>;
}>;

export type PrivySusuSigner = TransactionSigner &
  Readonly<{
    walletId: string;
    signSusuPayload(payload: unknown): Promise<string>;
  }>;

export function createPrivySusuSigner(input: Readonly<{
  wallet: PrivySolanaWallet;
  solana: PrivySolanaApi;
  caip2: string;
}>): PrivySusuSigner {
  const signSusuPayload = async (payload: unknown): Promise<string> => {
    const transaction = encodePayload(payload);
    if (input.solana.signAndSendTransaction) {
      const response = await input.solana.signAndSendTransaction(input.wallet.id, {
        caip2: input.caip2,
        transaction,
      });
      return response.hash ?? response.signature ?? transaction;
    }
    const response = await input.solana.signMessage?.(input.wallet.id, { message: transaction });
    if (!response?.signature) throw new Error('Privy Solana signer did not return a signature');
    return response.signature;
  };

  return {
    address: address(input.wallet.address),
    walletId: input.wallet.id,
    signSusuPayload,
    signAndSendTransactions: async (transactions) =>
      Promise.all(transactions.map(async (transaction) => toSignatureBytes(await signSusuPayload(transaction)))),
  };
}

function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload, stringifyBigInt), 'utf8').toString('base64');
}

function stringifyBigInt(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

function toSignatureBytes(value: string): SignatureBytes {
  const decoded = Buffer.from(value, 'base64');
  const bytes = decoded.length === 64 ? decoded : new Uint8Array(64);
  if (decoded.length !== 64) bytes.set(new TextEncoder().encode(value).slice(0, 64));
  return signatureBytes(bytes);
}

export function signerAddress(signer: PrivySusuSigner): Address {
  return signer.address;
}
