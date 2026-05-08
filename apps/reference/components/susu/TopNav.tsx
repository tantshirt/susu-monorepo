'use client';

import { useState } from 'react';

import { ClusterPill, type ClusterLabel } from './ClusterPill';
import { SkinToggle } from './SkinToggle';

type WalletStatus =
  | { kind: 'not-connected' }
  | { kind: 'privy-email'; email: string }
  | { kind: 'wallet-standard'; walletName: string };

type TopNavProps = {
  clusterLabel: ClusterLabel;
  walletStatus: WalletStatus;
  locale: LocaleCode;
  onLocaleChange: (locale: LocaleCode) => void;
  onDisconnect: () => void;
};

type LocaleCode = 'en' | 'vi' | 'ar' | 'es' | 'yo' | 'ht-kreyol';

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ar: 'العربية',
  es: 'Español',
  yo: 'Yorùbá',
  'ht-kreyol': 'Kreyòl Ayisyen',
};

function WalletBadge({ walletStatus, onDisconnect }: Pick<TopNavProps, 'walletStatus' | 'onDisconnect'>) {
  if (walletStatus.kind === 'not-connected') {
    return <span data-testid="wallet-status">not-connected</span>;
  }

  return (
    <div className="flex items-center gap-2" data-testid="wallet-status">
      <span>
        {walletStatus.kind === 'privy-email'
          ? `Privy: ${walletStatus.email}`
          : `Wallet-Standard: ${walletStatus.walletName}`}
      </span>
      <button type="button" className="rounded-md border px-2 py-1 text-sm" onClick={onDisconnect}>
        Disconnect
      </button>
    </div>
  );
}

export function TopNav({ clusterLabel, walletStatus, locale, onLocaleChange, onDisconnect }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <a className="font-semibold" href="/">
            susu
          </a>
          <ClusterPill label={clusterLabel} />
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          className="rounded-md border px-2 py-1 text-sm md:hidden"
          onClick={() => setMobileMenuOpen((value) => !value)}
        >
          ☰
        </button>

        <div className="hidden items-center gap-3 md:flex">
          <SkinToggle />
          <label className="sr-only" htmlFor="top-nav-locale">
            Locale
          </label>
          <select
            id="top-nav-locale"
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as LocaleCode)}
            className="rounded-md border px-2 py-1 text-sm"
            aria-label="Select locale"
          >
            {(Object.entries(LOCALE_LABELS) as Array<[LocaleCode, string]>).map(([code, nativeName]) => (
              <option key={code} value={code}>
                {nativeName}
              </option>
            ))}
          </select>
          <WalletBadge walletStatus={walletStatus} onDisconnect={onDisconnect} />
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <SkinToggle />
            <label className="sr-only" htmlFor="top-nav-locale-mobile">
              Locale
            </label>
            <select
              id="top-nav-locale-mobile"
              value={locale}
              onChange={(event) => onLocaleChange(event.target.value as LocaleCode)}
              className="rounded-md border px-2 py-1 text-sm"
              aria-label="Select locale"
            >
              {(Object.entries(LOCALE_LABELS) as Array<[LocaleCode, string]>).map(([code, nativeName]) => (
                <option key={code} value={code}>
                  {nativeName}
                </option>
              ))}
            </select>
            <WalletBadge walletStatus={walletStatus} onDisconnect={onDisconnect} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
