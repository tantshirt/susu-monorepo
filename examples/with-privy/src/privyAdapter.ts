import { Buffer } from 'node:buffer';
import { address, signatureBytes, type Address, type SignatureBytes, type TransactionSigner } from '@solana/kit';
import bs58 from 'bs58';

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
      const signature = response.hash ?? response.signature;
      if (!signature) throw new Error('Privy Solana signer did not return a transaction signature');
      return signature;
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
  const base58 = decodeBase58Signature(value);
  if (base58) return signatureBytes(base58);
  const base64 = decodeBase64Signature(value);
  if (base64) return signatureBytes(base64);
  throw new Error('Privy signature must decode to 64 bytes');
}

function decodeBase58Signature(value: string): Uint8Array | undefined {
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) return undefined;
  const decoded = bs58.decode(value);
  return decoded.length === 64 ? decoded : undefined;
}

function decodeBase64Signature(value: string): Uint8Array | undefined {
  const decoded = Buffer.from(value, 'base64');
  const canonical = decoded.toString('base64').replace(/=+$/, '');
  return decoded.length === 64 && canonical === value.replace(/=+$/, '') ? decoded : undefined;
}

export function signerAddress(signer: PrivySusuSigner): Address {
  return signer.address;
}
