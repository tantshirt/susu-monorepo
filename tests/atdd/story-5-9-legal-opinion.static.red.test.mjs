import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const storyPath = 'output_susu/implementation-artifacts/5-9-legal-opinion.md';
const checklistPath = 'output_susu/test-artifacts/atdd-checklist-5-9-legal-opinion.md';
const engagementPath = 'docs/legal-engagement.md';
const sowSummaryPath = 'docs/legal-sow-summary.md';
const opinionPath = 'docs/legal-opinion.pdf';
const handoffScriptPath = 'scripts/legal-handoff.sh';
const placeholderScriptPath = 'scripts/render-legal-placeholder.sh';
const readmePath = 'README.md';
const docsReadmePath = 'docs/README.md';
const logPath = 'log/2026-05-08.md';

function read(path, encoding = 'utf8') {
  return readFileSync(path, encoding);
}

function compact(source) {
  return String(source).toLowerCase().replace(/\s+/g, ' ');
}

test('Story 5.9 ATDD artifacts exist and identify the publication target', () => {
  assert.ok(existsSync(storyPath), 'Story 5.9 implementation artifact must exist');
  assert.ok(existsSync(checklistPath), 'Story 5.9 ATDD checklist must exist');

  const story = read(storyPath);
  const checklist = read(checklistPath);

  assert.match(story, /docs\/legal-opinion\.pdf/, 'story must identify legal opinion publication path');
  assert.match(story, /Issue:\s*#52/, 'story must trace to GitHub issue #52');
  assert.match(checklist, /5\.9|legal opinion|docs\/legal-opinion\.pdf/i, 'checklist must record Story 5.9 legal publication coverage');
});

test('legal engagement tracker records firm scope, SOW status, delivery, and PDF path', () => {
  assert.ok(existsSync(engagementPath), 'docs/legal-engagement.md must exist');
  const doc = read(engagementPath);
  const normalized = compact(doc);

  for (const required of [
    /firm/,
    /sow signed date/,
    /sow status/,
    /expected delivery/,
    /status/,
    /docs\/legal-opinion\.pdf/,
    /non-custodial/,
    /non-fee/,
    /non-yield/,
  ]) {
    assert.match(normalized, required, `legal engagement tracker must include ${required}`);
  }
});

test('legal handoff references required background and writes only transient output', () => {
  assert.ok(existsSync(handoffScriptPath), 'scripts/legal-handoff.sh must exist');
  const script = read(handoffScriptPath);
  const engagement = read(engagementPath);
  const combined = `${script}\n${engagement}`;

  for (const requiredPath of [
    'docs/fincen-cvc-framing.md',
    'docs/threat-model.md',
    'docs/architecture-notes.md',
    'programs/susu/idl/susu.json',
    'programs/susu/src/state',
  ]) {
    assert.match(combined, new RegExp(requiredPath.replace(/[/.]/g, '\\$&')), `${requiredPath} must be handed to counsel`);
  }

  assert.match(script, /output_susu\/legal-handoff|LEGAL_HANDOFF_OUT/, 'handoff output must stay in ignored transient output');
  assert.doesNotMatch(script, /docs\/legal-handoff\.tar/, 'handoff must not write public bundle tarballs under docs');
});

test('placeholder PDF exists and documents delay without legal overclaiming', () => {
  assert.ok(existsSync(opinionPath), 'docs/legal-opinion.pdf must exist');
  assert.ok(existsSync(placeholderScriptPath), 'scripts/render-legal-placeholder.sh must exist');
  assert.ok(existsSync(sowSummaryPath), 'docs/legal-sow-summary.md must exist');

  const pdf = read(opinionPath, 'latin1');
  const placeholderScript = read(placeholderScriptPath);
  const sow = read(sowSummaryPath);

  assert.match(pdf, /%PDF-/, 'legal opinion artifact must be a PDF file');
  assert.match(pdf, /Legal Opinion Placeholder/, 'placeholder PDF must identify itself as a placeholder');
  assert.match(pdf, /Firm Letter Delayed/, 'placeholder PDF must explain that the firm letter is delayed');
  assert.match(pdf, /docs\/legal-sow-summary\.md/, 'placeholder PDF must link the SOW summary');
  assert.match(placeholderScript, /docs\/legal-opinion\.pdf/, 'placeholder renderer must target the public PDF path');
  assert.match(sow, /non-confidential/i, 'SOW summary must mark itself as non-confidential');
  assert.doesNotMatch(compact(pdf), /counsel concludes|legal opinion concludes|is not a money services business/, 'placeholder must not fabricate a legal conclusion');
});

test('README badge cluster and docs index link to the legal opinion', () => {
  const readme = read(readmePath);
  const docsReadme = read(docsReadmePath);

  assert.match(readme, /\[!\[Legal Opinion\].*\]\(\.\/docs\/legal-opinion\.pdf\)/s, 'README badge cluster must link directly to the legal opinion PDF');
  assert.match(docsReadme, /\[Legal engagement\]\(\.\/legal-engagement\.md\)/, 'docs index must link legal engagement tracker');
  assert.match(docsReadme, /\[Legal opinion\]\(\.\/legal-opinion\.pdf\)/, 'docs index must link legal opinion PDF');
});

test('legal engagement is logged for transparency', () => {
  assert.ok(existsSync(logPath), 'daily log for 2026-05-08 must exist');
  const log = read(logPath);

  assert.match(log, /Story 5\.9|legal opinion|legal engagement/i, 'daily log must record the Story 5.9 legal engagement');
  assert.match(log, /docs\/legal-opinion\.pdf/, 'daily log must mention the public legal opinion artifact');
});
