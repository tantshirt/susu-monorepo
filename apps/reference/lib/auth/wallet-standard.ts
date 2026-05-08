'use client';

import { useMemo } from 'react';

import { useWallets } from '@solana/react-hooks';

import { signerFromWalletStandard, type WalletLike } from './signer.js';

const KNOWN_EXTENSION_WALLETS = new Set(['Phantom', 'Backpack', 'Solflare']);

type BrowserWallet = WalletLike & Readonly<{
  name: string;
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
