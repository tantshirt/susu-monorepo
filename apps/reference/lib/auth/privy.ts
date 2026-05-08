import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

import { getPublicEnv } from '../env.js';
import { signerFromPrivyWallet, type WalletLike } from './signer.js';

const privyAppId = getPublicEnv('NEXT_PUBLIC_PRIVY_APP_ID') ?? '';
const FALLBACK_WALLET_ADDRESS = 'privy-embedded-wallet-unavailable';

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

export function getPrivyState(): PrivyState {
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
  } catch {
    return { available: false, reason: 'provider_error' };
  }
}

function getFallbackPrivyWallet(): WalletLike {
  return {
    address: FALLBACK_WALLET_ADDRESS,
    signMessage: async () => {
      throw new Error('privy_wallet_not_connected');
    },
    signTransaction: async () => {
      throw new Error('privy_wallet_not_connected');
    },
  };
}

export function getPrivySigner(wallet?: WalletLike) {
  return signerFromPrivyWallet(wallet ?? getFallbackPrivyWallet());
}
