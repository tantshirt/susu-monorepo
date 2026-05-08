'use client';

import { useEffect, useMemo, useState } from 'react';

import { getPrivySigner, getPrivyState } from '../../../lib/auth/privy.js';
import { useWalletStandardSigner } from '../../../lib/auth/wallet-standard.js';

export default function LoginPage() {
  const privyState = getPrivyState();
  const walletStandardSigner = useWalletStandardSigner();
  const [selectedPath, setSelectedPath] = useState<'privy' | 'wallet-standard'>(
    privyState.available ? 'privy' : 'wallet-standard',
  );

  useEffect(() => {
    if (!privyState.available) {
      setSelectedPath('wallet-standard');
    }
  }, [privyState.available]);

  const signer = useMemo(() => {
    if (selectedPath === 'privy') {
      return getPrivySigner();
    }
    return walletStandardSigner;
  }, [selectedPath, walletStandardSigner]);

  return (
    <main>
      <h1>Sign in</h1>
      <button
        type="button"
        data-testid="cta-privy-email"
        disabled={!privyState.available}
        onClick={() => setSelectedPath('privy')}
      >
        Continue with Privy email
      </button>
      <button
        type="button"
        data-testid="cta-wallet-extension"
        onClick={() => setSelectedPath('wallet-standard')}
      >
        Use a wallet extension
      </button>

      {!privyState.available ? (
        <p data-testid="privy-unavailable">Privy unavailable; using Wallet-Standard fallback.</p>
      ) : null}

      <p data-testid="selected-auth-path">Selected auth path: {selectedPath}</p>
      <p data-testid="signer-source">Signer source: {signer?.source ?? 'none'}</p>
    </main>
  );
}
