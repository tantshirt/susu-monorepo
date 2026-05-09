import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const cases = [
  {
    name: 'Privy',
    doc: 'docs/integration-privy.md',
    example: 'examples/with-privy',
    package: 'examples/with-privy/package.json',
    link: '../examples/with-privy/',
    requiredText: ['runPrivySusuDemo', 'PrivyClient', 'createGroup', 'acceptInvite', 'postCollateral', 'contribute', 'wallet-standard direct connect'],
  },
  {
    name: 'Squads',
    doc: 'docs/integration-squads.md',
    example: 'examples/with-squads',
    package: 'examples/with-squads/package.json',
    link: '../examples/with-squads/',
    requiredText: ['createSquadsMultisigSigner', 'deriveGroupPda', 'createGroup', 'threshold approval', 'vault transaction', 'recovery model'],
  },
  {
    name: 'Token Extensions',
    doc: 'docs/integration-token-extensions.md',
    example: 'examples/with-token-extensions',
    package: 'examples/with-token-extensions/package.json',
    link: '../examples/with-token-extensions/',
    requiredText: ['runToken2022SusuDemo', 'buildToken2022MintPlan', 'Transfer Hook', 'Metadata Pointer', 'Permanent Delegate', 'confidential-extension roadmap'],
  },
];

function read(path) {
  return readFileSync(path, 'utf8');
}

function firstSectionHeading(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('## '));
}

function packageVersions(path) {
  const pkg = JSON.parse(read(path));
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

test('Story 6.9 creates the three long-form partner integration guides', () => {
  for (const item of cases) {
    assert.ok(existsSync(item.doc), `${item.doc} must exist`);
    const doc = read(item.doc);

    assert.equal(firstSectionHeading(doc), '## TL;DR', `${item.name} guide must start with ## TL;DR`);
    for (const heading of ['Architecture', 'Walkthrough', 'Trade-offs', 'Pinned versions', 'See also']) {
      assert.match(doc, new RegExp(`## ${heading}`), `${item.name} guide must include ## ${heading}`);
    }
    assert.match(doc, /```mermaid[\s\S]+```/, `${item.name} guide must include a Mermaid architecture diagram`);
    assert.match(doc, new RegExp(item.link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${item.name} guide must link to ${item.link}`);
    assert.doesNotMatch(doc, /\blatest\b/i, `${item.name} guide must avoid "latest" version guidance`);

    for (const text of item.requiredText) {
      assert.match(doc, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${item.name} guide must mention ${text}`);
    }
  }
});

test('Story 6.9 pinned versions match each example package.json exactly', () => {
  for (const item of cases) {
    const doc = read(item.doc);
    const versions = packageVersions(item.package);

    for (const [pkg, version] of Object.entries(versions)) {
      assert.match(doc, new RegExp(`\\|\\s*\`${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`\\s*\\|\\s*\`${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`\\s*\\|`), `${item.name} guide must pin ${pkg} to ${version}`);
    }
  }
});

test('Story 6.9 example READMEs cross-link to their integration guides', () => {
  for (const item of cases) {
    const readme = read(`${item.example}/README.md`);
    const relativeDoc = item.doc.replace('docs/', '../../docs/');
    assert.match(readme, new RegExp(relativeDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${item.example}/README.md must link to ${relativeDoc}`);
  }
});

test('Story 6.9 docs index links guides and records copy-paste quality bar', () => {
  const index = read('docs/README.md');
  for (const path of ['integration-privy.md', 'integration-squads.md', 'integration-token-extensions.md']) {
    assert.match(index, new RegExp(path), `docs/README.md must link ${path}`);
  }
  assert.match(index, /copy-paste runnable walkthroughs/i, 'docs index must document the runnable walkthrough quality bar');
  assert.match(index, /package\.json/i, 'docs index must require version pins to match package.json');
});
