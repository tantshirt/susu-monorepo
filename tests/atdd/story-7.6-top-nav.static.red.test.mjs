import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

async function readRepoFile(relativePath) {
  return fs.readFile(path.join(REPO_ROOT, relativePath), 'utf8');
}

function assertSourceMatchesAll(source, needles, messageBuilder) {
  for (const needle of needles) {
    assert.match(source, needle instanceof RegExp ? needle : new RegExp(escapeRegExp(needle)), messageBuilder(needle));
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('[P0] TopNav renders required controls and keeps ClusterPill always visible', async () => {
  const source = await readRepoFile('apps/reference/components/susu/TopNav.tsx');
  const needles = [
    '<ClusterPill label={clusterLabel} />',
    'aria-label="Toggle navigation menu"',
    'md:hidden',
    'md:flex',
    'not-connected',
    'Privy:',
    'Wallet-Standard:',
    'Disconnect',
    'ht-kreyol',
    'Tiếng Việt',
    'العربية',
    'Español',
    'Yorùbá',
    'Kreyòl Ayisyen',
  ];
  assertSourceMatchesAll(source, needles, (needle) => `TopNav must include ${needle}`);
});

test('[P0] ClusterPill styling follows label-based devnet/mainnet-beta contract', async () => {
  const source = await readRepoFile('apps/reference/components/susu/ClusterPill.tsx');
  const needles = [
    "export type ClusterLabel = 'devnet' | 'mainnet-beta';",
    /devnet:[\s\S]*bg-mint-500/,
    /'mainnet-beta':[\s\S]*bg-mint-500[\s\S]*border/,
    '{label}',
  ];
  assertSourceMatchesAll(source, needles, (needle) => `ClusterPill must include ${needle}`);
});

test('[P0] Top nav is mounted in root layout and Playwright covers /404 cluster-pill visibility', async () => {
  const layout = await readRepoFile('apps/reference/app/layout.tsx');
  assert.match(layout, /<TopNav/, 'Root layout must render TopNav');

  const playwright = await readRepoFile('apps/reference/tests/e2e/top-nav.cluster-pill.spec.ts');
  const needles = ['const ROUTES = [\'\/\', \'\/404\'];', "getByTestId('cluster-pill')", 'toBeVisible'];
  assertSourceMatchesAll(playwright, needles, (needle) => `Playwright top-nav spec must include ${needle}`);
});
