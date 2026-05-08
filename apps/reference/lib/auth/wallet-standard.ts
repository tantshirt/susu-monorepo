'use client';

import { useMemo } from 'react';

import { useWallets } from '@solana/react-hooks';

import { signerFromWalletStandard } from './signer.js';

const KNOWN_EXTENSION_WALLETS = new Set(['Phantom', 'Backpack', 'Solflare']);

type BrowserWallet = Readonly<{
  name: string;
  accounts?: ReadonlyArray<Readonly<{ address: string }>>;
  signMessage?: (input: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: <T>(input: T) => Promise<T>;
}>;

export function useWalletStandardWallets(): ReadonlyArray<BrowserWallet> {
  const wallets = useWallets() as ReadonlyArray<BrowserWallet>;

  return useMemo(
    () => wallets.filter((wallet) => KNOWN_EXTENSION_WALLETS.has(wallet.name)),
    [wallets],
  );
}

export function useWalletStandardSigner() {
  const wallets = useWalletStandardWallets();
  return useMemo(() => signerFromWalletStandard(wallets[0] ?? {}), [wallets]);
}
