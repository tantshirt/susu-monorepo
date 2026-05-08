import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

import { getPublicEnv } from '../env.js';
import { signerFromPrivyWallet } from './signer.js';

const privyAppId = getPublicEnv('NEXT_PUBLIC_PRIVY_APP_ID') ?? '';

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

export function getPrivySigner(wallet: Readonly<{ address?: string; signMessage?: (input: Uint8Array) => Promise<Uint8Array>; signTransaction?: <T>(input: T) => Promise<T> }>) {
  return signerFromPrivyWallet(wallet);
}
