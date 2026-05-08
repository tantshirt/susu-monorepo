import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

import { getPublicEnv } from '../env.js';
import { signerFromPrivyWallet, type WalletLike } from './signer.js';

export type PrivyState =
  | Readonly<{
      available: true;
      appId: string;
      config: Readonly<Record<string, unknown>>;
    }>
  | Readonly<{
      available: false;
      reason: 'missing_app_id' | 'provider_error';
      appId?: undefined;
      config?: undefined;
    }>;

type PrivyWindow = Window & { _privyEmbeddedWallet?: WalletLike };

export function getPrivyState(): PrivyState {
  const privyAppId = getPublicEnv('NEXT_PUBLIC_PRIVY_APP_ID');
  if (!privyAppId) {
    return { available: false, reason: 'missing_app_id' };
  }

  try {
    return {
      available: true,
      appId: privyAppId,
      config: {
        loginMethods: ['email'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      },
    };
  } catch (error) {
    console.error('privy_provider_error', error);
    return { available: false, reason: 'provider_error' };
  }
}

export function getPrivyEmbeddedWallet(): WalletLike | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const wallet = (window as PrivyWindow)._privyEmbeddedWallet;
  return wallet?.address ? wallet : undefined;
}

export function getPrivySigner(wallet?: WalletLike) {
  return wallet ? signerFromPrivyWallet(wallet) : undefined;
}
