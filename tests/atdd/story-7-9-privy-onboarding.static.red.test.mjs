import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const privyWrapperPath = `${appRoot}/app/providers/PrivyProviderWrapper.tsx`;
const useWalletPath = `${appRoot}/lib/wallet/useWallet.ts`;
const walletStatusPath = `${appRoot}/components/nav/WalletStatus.tsx`;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

const DIRECTIONAL = /\b(right-|left-|pl-|pr-|ml-|mr-)/;

test('Story 7.9 PrivyProviderWrapper imports from @privy-io/react-auth and configures loginMethods', () => {
  assertExists(privyWrapperPath);
  const src = read(privyWrapperPath);
  assert.match(
    src,
    /from\s+["']@privy-io\/react-auth["']/,
    'PrivyProviderWrapper must import from @privy-io/react-auth',
  );
  assert.match(src, /PrivyProvider/, 'PrivyProviderWrapper must render PrivyProvider');
  assert.match(src, /loginMethods[^]*?email/, 'config.loginMethods must include "email"');
  assert.match(src, /loginMethods[^]*?wallet/, 'config.loginMethods must include "wallet"');
});

test('Story 7.9 PrivyProviderWrapper configures embedded wallet creation for users-without-wallets', () => {
  const src = read(privyWrapperPath);
  assert.match(
    src,
    /embeddedWallets[^}]*?createOnLogin[^}]*?users-without-wallets/,
    'embeddedWallets.createOnLogin must be "users-without-wallets" (FR39)',
  );
});

test('Story 7.9 PrivyProviderWrapper sets dark appearance theme', () => {
  const src = read(privyWrapperPath);
  assert.match(
    src,
    /appearance[^}]*?theme[^}]*?dark/,
    'appearance.theme must be "dark" to match the Phantom-fintech skin',
  );
});

test('Story 7.9 PrivyProviderWrapper sources Solana RPC config from getRpcUrl()', () => {
  const src = read(privyWrapperPath);
  assert.match(
    src,
    /getRpcUrl/,
    'PrivyProviderWrapper must reference getRpcUrl (Story 7.16) for cluster RPC',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/rpc\/getRpcUrl["']/,
    'PrivyProviderWrapper must import getRpcUrl from @/lib/rpc/getRpcUrl',
  );
  assert.match(src, /solana/i, 'config must include a solana section');
});

test('Story 7.9 useWallet hook exists, is client-only, and returns the unified shape', () => {
  assertExists(useWalletPath);
  const src = read(useWalletPath);
  assert.match(src, /^["']use client["']/m, 'useWallet must declare "use client"');
  assert.match(
    src,
    /from\s+["']@privy-io\/react-auth["']/,
    'useWallet must import from @privy-io/react-auth',
  );
  assert.match(src, /usePrivy/, 'useWallet must call usePrivy()');
  assert.match(src, /export\s+function\s+useWallet|export\s+const\s+useWallet/, 'useWallet must be exported');
  for (const key of ['connected', 'address', 'cluster', 'provider']) {
    assert.match(src, new RegExp(key), `useWallet return shape must reference \`${key}\``);
  }
  assert.match(
    src,
    /wallet-standard/,
    'useWallet must reference the "wallet-standard" provider value',
  );
});

test('Story 7.9 WalletStatus consumes useWallet and Privy login/logout', () => {
  assertExists(walletStatusPath);
  const src = read(walletStatusPath);
  assert.match(src, /^["']use client["']/m, 'WalletStatus must remain a client component');
  assert.match(
    src,
    /from\s+["']@\/lib\/wallet\/useWallet["']/,
    'WalletStatus must import useWallet from @/lib/wallet/useWallet',
  );
  assert.match(
    src,
    /from\s+["']@privy-io\/react-auth["']/,
    'WalletStatus must import from @privy-io/react-auth (login/logout actions)',
  );
  assert.match(src, /usePrivy/, 'WalletStatus must call usePrivy() to drive login/logout');
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/dropdown-menu["']/,
    'WalletStatus must use shadcn DropdownMenu for the connected state',
  );
});

test('Story 7.9 changed files use logical Tailwind classes only', () => {
  for (const p of [privyWrapperPath, useWalletPath, walletStatusPath]) {
    const src = read(p);
    assert.doesNotMatch(
      src,
      DIRECTIONAL,
      `${p} must use logical Tailwind classes (start-/end-/ps-/pe-/ms-/me-) only`,
    );
  }
});
