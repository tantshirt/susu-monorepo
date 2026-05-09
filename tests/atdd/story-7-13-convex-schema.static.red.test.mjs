import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const appRoot = 'apps/reference';
const schemaPath = `${appRoot}/convex/schema.ts`;
const groupsPath = `${appRoot}/convex/groups.ts`;
const clientPath = `${appRoot}/lib/convex/client.ts`;
const useGroupMetaPath = `${appRoot}/lib/convex/use-group-metadata.ts`;
const useInviteLinkPath = `${appRoot}/lib/convex/use-invite-link.ts`;
const convexWrapperPath = `${appRoot}/app/providers/ConvexProviderWrapper.tsx`;
const checkPatternsPath = 'scripts/check-patterns.sh';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 7.13 Convex schema defines groupMetadata, inviteLinks, memberDisplayNames tables (ARCH-30)', () => {
  assertExists(schemaPath);
  const src = read(schemaPath);

  assert.match(src, /from\s+["']convex\/server["']/, 'schema.ts must import from convex/server');
  assert.match(src, /defineSchema/, 'schema.ts must use defineSchema');
  assert.match(src, /defineTable/, 'schema.ts must use defineTable');
  assert.match(src, /from\s+["']convex\/values["']/, 'schema.ts must import v from convex/values');

  // The three required tables (ARCH-30, issue #77 AC)
  assert.match(src, /groupMetadata\s*:/, 'schema.ts must define groupMetadata table');
  assert.match(src, /inviteLinks\s*:/, 'schema.ts must define inviteLinks table');
  assert.match(src, /memberDisplayNames\s*:/, 'schema.ts must define memberDisplayNames table');

  // Required fields
  assert.match(src, /groupPda\b/, 'tables must reference groupPda field');
  assert.match(src, /\bname\b/, 'groupMetadata must include name field');
  assert.match(src, /\blocale\b/, 'groupMetadata must include locale field');
  assert.match(src, /\bcreatedAt\b/, 'tables must include createdAt timestamp');
  assert.match(src, /\btoken\b/, 'inviteLinks must include token field');
  assert.match(src, /memberPubkey\b/, 'memberDisplayNames must include memberPubkey field');
  assert.match(src, /displayName\b/, 'memberDisplayNames must include displayName field');

  assert.match(src, /export\s+default\s+\w/, 'schema.ts must default-export the schema');
});

test('Story 7.13 groups.ts exports query, mutation, eraseUserData and per-group isolation lock', () => {
  assertExists(groupsPath);
  const src = read(groupsPath);

  // query + mutation helpers from convex
  assert.match(src, /from\s+["']convex\/server["']|from\s+["'](\.\.\/)*_generated\/server["']/, 'groups.ts must import server helpers');

  assert.match(src, /\bgetGroupMetadata\b/, 'groups.ts must export getGroupMetadata query');
  assert.match(src, /\bupsertGroupMetadata\b/, 'groups.ts must export upsertGroupMetadata mutation');
  assert.match(src, /\beraseUserData\b/, 'groups.ts must export eraseUserData mutation (Article 17)');

  // Article 17: erasure deletes from memberDisplayNames for a given pubkey
  assert.match(src, /memberDisplayNames/, 'eraseUserData must operate on memberDisplayNames table');
  assert.match(src, /\.delete\(/, 'eraseUserData must delete rows');

  // Isolation lock (ARCH-31): per-group lock keyed by groupPda for writes
  assert.match(src, /isolation\s*lock|acquireLock|groupLock|lockKey|withGroupLock/i,
    'groups.ts must implement a per-group isolation lock for writes (ARCH-31)');
});

test('Story 7.13 lib/convex/client.ts exports a ConvexReactClient singleton', () => {
  assertExists(clientPath);
  const src = read(clientPath);

  assert.match(src, /from\s+["']convex\/react["']/, 'client.ts must import from convex/react');
  assert.match(src, /ConvexReactClient/, 'client.ts must use ConvexReactClient');
  assert.match(src, /from\s+["']@\/lib\/env["']|from\s+["']\.\.\/env["']/, 'client.ts must consume env via @/lib/env');
  assert.match(src, /NEXT_PUBLIC_CONVEX_URL/, 'client.ts must reference NEXT_PUBLIC_CONVEX_URL');
  assert.match(src, /export\s+(const|function|default)/, 'client.ts must export the client');
});

test('Story 7.13 use-group-metadata.ts and use-invite-link.ts hooks exist in lib/convex/', () => {
  assertExists(useGroupMetaPath);
  assertExists(useInviteLinkPath);

  const meta = read(useGroupMetaPath);
  const invite = read(useInviteLinkPath);

  assert.match(meta, /from\s+["']convex\/react["']/, 'use-group-metadata.ts must import from convex/react');
  assert.match(invite, /from\s+["']convex\/react["']/, 'use-invite-link.ts must import from convex/react');
  assert.match(meta, /export\s+(function|const)\s+useGroupMetadata/, 'must export useGroupMetadata hook');
  assert.match(invite, /export\s+(function|const)\s+useInviteLink/, 'must export useInviteLink hook');
});

test('Story 7.13 ConvexProviderWrapper consumes the client from lib/convex/client', () => {
  assertExists(convexWrapperPath);
  const src = read(convexWrapperPath);

  assert.match(src, /from\s+["']@\/lib\/convex\/client["']|from\s+["']\.\.\/(\.\.\/)*lib\/convex\/client["']/,
    'ConvexProviderWrapper must import the client from @/lib/convex/client');
});

test('Story 7.13 check-patterns.sh fails on convex import outside apps/reference/lib/convex (lock enforced)', () => {
  assertExists(checkPatternsPath);
  const src = read(checkPatternsPath);

  // Must already grep for convex/ imports (extension done in Story 7.1; reaffirmed here)
  assert.match(src, /convex/, 'check-patterns.sh must include a convex-import isolation check');
  assert.match(src, /apps\/reference\/lib\/convex/, 'check-patterns.sh must whitelist apps/reference/lib/convex/');
  assert.match(src, /@convex-dev/, 'check-patterns.sh must also catch @convex-dev/* imports');
});

test('Story 7.13 check-patterns.sh runs cleanly against the current tree (no isolation violations)', () => {
  const result = spawnSync('bash', [checkPatternsPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, `check-patterns.sh must exit 0; stderr:\n${result.stderr}`);
});
