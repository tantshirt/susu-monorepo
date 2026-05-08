import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const docPath = 'docs/collateral-curve.md';
const storyPath = 'output_susu/implementation-artifacts/5-5-collateral-curve-doc.md';
const curvePath = 'programs/susu/src/curve.rs';
const invariantPath = 'tests/invariants/no_strategic_default.rs';
const reportPath = 'audits/adversary/adversary-report.json';

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.replace(/\s+/g, ' ');
}

function firstSectionHeading(markdown) {
  const headings = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s+/.test(line));

  return headings.find((line) => line.startsWith('## '));
}

function requiredCollateral(contribution, n, slot) {
  return contribution * (2 * n - 1 - slot);
}

test('Story 5.5 doc starts with TL;DR and states the Curve Invariant', () => {
  assert.ok(existsSync(docPath), `${docPath} must exist`);

  const doc = read(docPath);
  assert.equal(firstSectionHeading(doc), '## TL;DR', 'first section after H1 must be ## TL;DR');
  assert.match(doc, /Curve Invariant/i, 'TL;DR must name the Curve Invariant');
  assert.match(
    compact(doc),
    /strategic default[^.]+(unprofitable|strictly negative)|expected_default_payoff\(i\)[^.]+<\s*0/i,
    'TL;DR must restate the no-strategic-default claim'
  );
});

test('Story 5.5 doc contains formula, derivation, and proof sketch tied to curve.rs', () => {
  assert.ok(existsSync(curvePath), `${curvePath} must exist`);
  assert.ok(existsSync(docPath), `${docPath} must exist`);

  const curve = read(curvePath);
  const doc = read(docPath);
  const squashed = compact(doc);

  assert.match(curve, /contribution\s*\*\s*\(2\*n\s*-\s*1\s*-\s*slot\)|2\*n - 1 - slot/, 'curve source must retain the canonical formula');
  assert.match(doc, /## Derivation/i, 'doc must include a derivation section');
  assert.match(doc, /## Proof Sketch/i, 'doc must include a proof sketch section');
  assert.match(squashed, /C_?\{?i\}?\s*=\s*c\s*\(?2n\s*-\s*1\s*-\s*i\)?|C_i = c\(2n - 1 - i\)/, 'doc must state the closed-form collateral formula');
  assert.match(squashed, /\(n\s*-\s*1\)\s*c\s*-\s*i\s*c\s*-\s*C_?\{?i\}?/, 'doc must derive payoff from payout, paid contributions, and collateral');
  assert.match(squashed, /expected_default_payoff\(i\)\s*=\s*-n\s*\*?\s*c|=\s*-nc|<\s*0/, 'doc must show payoff is strictly negative');
  assert.match(squashed, /assumptions?|valid slot|positive contribution/i, 'proof sketch must state assumptions');
});

test('Story 5.5 worked USDC examples match the closed-form curve values', () => {
  assert.ok(existsSync(docPath), `${docPath} must exist`);

  const doc = read(docPath);
  const cases = [
    { n: 3, slot: 0, contribution: 100, collateral: requiredCollateral(100, 3, 0), payoff: -300 },
    { n: 3, slot: 2, contribution: 100, collateral: requiredCollateral(100, 3, 2), payoff: -300 },
    { n: 5, slot: 0, contribution: 100, collateral: requiredCollateral(100, 5, 0), payoff: -500 },
    { n: 5, slot: 4, contribution: 100, collateral: requiredCollateral(100, 5, 4), payoff: -500 },
    { n: 10, slot: 0, contribution: 100, collateral: requiredCollateral(100, 10, 0), payoff: -1000 },
    { n: 10, slot: 9, contribution: 100, collateral: requiredCollateral(100, 10, 9), payoff: -1000 },
  ];

  for (const { n, slot, collateral, payoff } of cases) {
    const row = new RegExp(`\\|\\s*${n}\\s*\\|\\s*${slot}\\s*\\|\\s*\\$100(?:\\.00)?\\s*USDC\\s*\\|\\s*\\$${collateral}(?:\\.00)?\\s*USDC\\s*\\|\\s*\\$${payoff}(?:\\.00)?\\s*USDC\\s*\\|`, 'i');
    assert.match(doc, row, `worked example row must include n=${n}, slot=${slot}, collateral=$${collateral}, payoff=$${payoff}`);
  }
});

test('Story 5.5 doc cites verifier paths that resolve to real evidence', () => {
  for (const path of [docPath, invariantPath, reportPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const doc = read(docPath);
  const report = JSON.parse(read(reportPath));

  assert.match(doc, /tests\/invariants\/no_strategic_default\.rs/, 'doc must cite invariant proptest path');
  assert.match(doc, /audits\/adversary\/adversary-report\.json/, 'doc must cite adversary report path');
  assert.equal(report.summary.max_defector_profit_lamports, 0, 'canonical adversary report must show no profitable defector');
});

test('Story 5.5 records non-cryptoeconomist comprehension review evidence', () => {
  assert.ok(existsSync(storyPath), `${storyPath} must exist`);

  const story = read(storyPath);
  assert.match(story, /### Comprehension Review/i, 'story must include comprehension review section');
  assert.match(story, /reviewer role:\s*(?!pending)/i, 'review must record reviewer role');
  assert.match(story, /review date:\s*2026-05-08/i, 'review must record review date');
  assert.match(story, /outcome:\s*(?!pending).*restat(e|ed) the invariant/i, 'review outcome must say the reviewer could restate the invariant');
});
