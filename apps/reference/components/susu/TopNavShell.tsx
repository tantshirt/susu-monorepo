'use client';

import { useState } from 'react';

import { TopNav, type WalletStatus } from './TopNav';

export function TopNavShell() {
  const [locale, setLocale] = useState<'en' | 'vi' | 'ar' | 'es' | 'yo' | 'ht-kreyol'>('en');
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({ kind: 'not-connected' });

  return (
    <TopNav
      clusterLabel="devnet"
      walletStatus={walletStatus}
      locale={locale}
      onLocaleChange={setLocale}
      onDisconnect={() => setWalletStatus({ kind: 'not-connected' })}
    />
  );
}
