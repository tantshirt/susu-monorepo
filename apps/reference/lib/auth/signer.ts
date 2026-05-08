import type { Signer } from '../../../../../sdk/ts/src/helpers/signer.js';

type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;
type SignTransaction = <TTransaction>(transaction: TTransaction) => Promise<TTransaction>;

export type WalletLike = Readonly<{
  address?: string;
  accounts?: ReadonlyArray<Readonly<{ address: string }>>;
  signMessage?: SignMessage;
  signTransaction?: SignTransaction;
}>;

function asSigner(source: Signer['source'], publicKey: string, wallet: WalletLike): Signer {
  return {
    source,
    publicKey,
    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      if (!wallet.signMessage) {
        throw new Error('wallet_sign_message_unavailable');
      }
      return wallet.signMessage(message);
    },
    signTransaction: async <TTransaction>(transaction: TTransaction): Promise<TTransaction> => {
      if (!wallet.signTransaction) {
        throw new Error('wallet_sign_transaction_unavailable');
      }
      return wallet.signTransaction(transaction);
    },
  };
}

export function signerFromPrivyWallet(wallet: WalletLike): Signer | undefined {
  if (!wallet.address) {
    return undefined;
  }
  return asSigner('privy', wallet.address, wallet);
}

export function signerFromWalletStandard(wallet: WalletLike): Signer | undefined {
  const publicKey = wallet.accounts?.[0]?.address;
  if (!publicKey) {
    return undefined;
  }
  return asSigner('wallet-standard', publicKey, wallet);
}
