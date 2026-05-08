import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const docPath = 'docs/fincen-cvc-framing.md';
const postureScriptPath = 'scripts/check-fincen-posture.sh';
const storyPath = 'output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md';
const checklistPath = 'output_susu/test-artifacts/atdd-checklist-5-7-fincen-cvc-framing-doc.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.toLowerCase().replace(/\s+/g, ' ');
}

test('Story 5.7 ATDD artifacts exist and hand off the framing doc path', () => {
  assert.ok(existsSync(storyPath), 'Story 5.7 implementation artifact must exist');
  assert.ok(existsSync(checklistPath), 'Story 5.7 ATDD checklist must exist');

  const story = read(storyPath);
  const checklist = read(checklistPath);

  assert.match(story, /docs\/fincen-cvc-framing\.md/, 'story must identify the doc target');
  assert.match(story, /scripts\/check-fincen-posture\.sh/, 'story must identify posture enforcement');
  assert.match(checklist, /5\.7-DOC|docs\/static|static/i, 'checklist must record docs/static coverage');
});

test('Story 5.7 framing doc has TL;DR and cites FinCEN 2019 CVC guidance', () => {
  assert.ok(existsSync(docPath), 'docs/fincen-cvc-framing.md must exist');
  const doc = read(docPath);

  assert.match(doc, /^## TL;DR$/m, 'framing doc must include a TL;DR section');
  assert.match(doc, /FIN-2019-G001/, 'doc must cite FinCEN FIN-2019-G001');
  assert.match(doc, /May 9, 2019|May 09, 2019/, 'doc must identify the 2019 guidance date');
  assert.match(doc, /https:\/\/www\.fincen\.gov\//i, 'doc must link to the official FinCEN guidance');
});

test('Story 5.7 enumerates non-custodial, non-fee, and non-yield structure', () => {
  const normalized = compact(read(docPath));

  assert.match(normalized, /non-custodial|no custody/, 'doc must identify non-custodial posture');
  assert.match(normalized, /no keys|holds no keys/, 'doc must state the protocol team holds no user-token-account keys');
  assert.match(normalized, /no fee path|no protocol fee|fee path/, 'doc must state there is no fee path');
  assert.match(normalized, /no yield|yield-routing|yield routing/, 'doc must state there are no yield-routing CPIs');
});

test('Story 5.7 cites posture enforcement script and keeps the script present', () => {
  assert.ok(existsSync(postureScriptPath), 'scripts/check-fincen-posture.sh must exist');
  const doc = read(docPath);
  const script = read(postureScriptPath);

  assert.match(doc, /scripts\/check-fincen-posture\.sh/, 'doc must cite posture script by path');
  assert.match(doc, /Story 1\.4/i, 'doc must tie the posture script to Story 1.4 CI enforcement');
  assert.match(doc, /Story 3\.3/i, 'doc must tie the posture script to Story 3.3 vault/custody posture');
  assert.match(script, /token-account-init-authority/, 'script must scan token account authority posture');
  assert.match(script, /transfer-destination/, 'script must scan transfer destination posture');
  assert.match(script, /cpi-allowlist/, 'script must scan CPI allowlist posture');
});

test('Story 5.7 states posture-forfeiting changes and legal re-review triggers', () => {
  const normalized = compact(read(docPath));

  for (const required of [
    /admin instruction/,
    /upgrade authority/,
    /protocol fee|fee path/,
    /yield cpi|yield-routing cpi|yield routing cpi/,
    /keeper|scheduler/,
    /non-user-derived custody|custody/,
    /legal re-review|re-review/,
  ]) {
    assert.match(normalized, required, `doc must mention ${required}`);
  }
});

test('Story 5.7 stays inside structural posture and points to legal opinion', () => {
  const doc = read(docPath);
  const normalized = compact(doc);

  assert.match(normalized, /not legal advice|not a legal opinion|not a legal conclusion/, 'doc must disclaim legal conclusion');
  assert.match(doc, /Story 5\.9|docs\/legal-opinion\.pdf/, 'doc must point to the Story 5.9 legal opinion artifact');
  assert.doesNotMatch(normalized, /guarantees? (that )?susu/, 'doc must not guarantee a legal outcome');
});
