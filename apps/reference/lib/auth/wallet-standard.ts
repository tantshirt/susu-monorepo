'use client';

import { useMemo } from 'react';

import { useWallets } from '@solana/react-hooks';

import { signerFromWalletStandard, type WalletLike } from './signer.js';

type BrowserWallet = WalletLike & Readonly<{
  name: string;
}>;

export function useWalletStandardWallets(): ReadonlyArray<BrowserWallet> {
  const wallets = useWallets() as ReadonlyArray<BrowserWallet>;

  return useMemo(() => wallets.filter((wallet) => (wallet.accounts?.length ?? 0) > 0), [wallets]);
}

export function useWalletStandardSigner() {
  const wallets = useWalletStandardWallets();
  return useMemo(() => {
    const firstWallet = wallets[0];
    return firstWallet ? signerFromWalletStandard(firstWallet) : undefined;
  }, [wallets]);
}
