'use client';

import { useState } from 'react';

import { TopNav } from './TopNav';

export function TopNavShell() {
  const [locale, setLocale] = useState<'en' | 'vi' | 'ar' | 'es' | 'yo' | 'ht-kreyol'>('en');
  const [walletStatus, setWalletStatus] = useState<{ kind: 'not-connected' }>({ kind: 'not-connected' });

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
