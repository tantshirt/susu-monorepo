import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const release = readFileSync('.github/workflows/release.yml', 'utf8');
const contributing = readFileSync('CONTRIBUTING.md', 'utf8');

test('Story 6.12 release workflow is tag-driven and OIDC-enabled', () => {
  assert.match(release, /tags:\n\s+- "v\*"/);
  assert.match(release, /id-token: write/);
  assert.match(release, /attestations: write/);
  assert.doesNotMatch(release, /NPM_TOKEN|CARGO_TOKEN/);
});

test('Story 6.12 verifies IDL and SDK parity before publishing', () => {
  assert.match(release, /scripts\/check-idl-hash\.sh/);
  assert.match(release, /scripts\/check-sdk-parity\.sh/);
  assert.match(release, /bash scripts\/verify\.sh/);
});

test('Story 6.12 publishes npm before crates and gates GitHub release on both', () => {
  assert.match(release, /publish-npm:[\s\S]*needs: verify-build/);
  assert.match(release, /npm publish --access public --provenance/);
  assert.match(release, /publish-crates:[\s\S]*needs: publish-npm/);
  assert.match(release, /rust-lang\/crates-io-auth-action@v1/);
  assert.match(release, /github-release:[\s\S]*needs: publish-crates/);
});

test('Story 6.12 documents trusted-publisher setup and half-published recovery', () => {
  assert.match(contributing, /Releasing a new version/);
  assert.match(contributing, /Trusted publisher registration/);
  assert.match(contributing, /Half-published recovery/);
});
