import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const threatModelPath = 'docs/threat-model.md';
const coveragePath = 'tests/coverage/threat-model.md';

const requiredAttacks = [
  ['strategic-default', 'Strategic default', /strategic[- ]default/i],
  ['late-position-cartel', 'Late-position cartel / 30% Cartel', /(late[- ]position cartel|30%[- ]Cartel|30 percent cartel)/i],
  ['claim-dos', 'DoS via permissionless claim', /(DoS via permissionless claim|permissionless claim DoS|claim DoS)/i],
  ['pda-collision', 'Malicious PDA collision', /(PDA collision|malicious PDA)/i],
  ['unsafe-deserialization', 'Untrusted on-chain data deserialization', /(unsafe deserialization|untrusted on-chain data deserialization)/i],
  ['custodial-path', 'Custodial path inadvertent introduction', /(custodial path|custody)/i],
  ['scheduler-keeper', 'Scheduler or keeper introduction', /(scheduler|keeper)/i],
];

function read(path) {
  return readFileSync(path, 'utf8');
}

function sectionFor(source, headingPattern) {
  const heading = source.match(new RegExp(`^##+\\s+.*${headingPattern.source}.*$`, 'im'));
  assert.ok(heading, `missing threat model section for ${headingPattern}`);
  const start = heading.index ?? 0;
  const rest = source.slice(start + heading[0].length);
  const nextHeading = rest.search(/^##+\s+/m);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

function parseMarkdownTable(source) {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'));

  const headerIndex = lines.findIndex((line) =>
    ['attack', 'mitigation', 'test_file_path'].every((column) => line.toLowerCase().includes(column)),
  );
  assert.notEqual(headerIndex, -1, 'coverage matrix must include attack, mitigation, test_file_path headers');

  const headers = lines[headerIndex]
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
  assert.deepEqual(headers, ['attack', 'mitigation', 'test_file_path']);

  return lines.slice(headerIndex + 2).map((line) => {
    const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function assertCitedPathsExist(rows) {
  for (const row of rows) {
    assert.ok(row.test_file_path.length > 0, `${row.attack} row must include a test_file_path`);
    const citedPaths = row.test_file_path.split(/<br\s*\/?>|,/i).map((path) => path.trim()).filter(Boolean);
    for (const citedPath of citedPaths) assert.ok(existsSync(citedPath), `${row.attack} cites missing path: ${citedPath}`);
  }
}

test('Story 5.6 threat model enumerates every required adversary with vector, mitigation, and residual risk', () => {
  assert.ok(existsSync(threatModelPath), 'docs/threat-model.md must exist');
  const source = read(threatModelPath);

  for (const [, label, pattern] of requiredAttacks) {
    assert.match(source, pattern, `threat model must enumerate ${label}`);
    const section = sectionFor(source, pattern);
    assert.match(section, /Attack vector:/i, `${label} must state the attack vector`);
    assert.match(section, /Mitigation:/i, `${label} must state the mitigation`);
    assert.match(section, /Residual risk:/i, `${label} must state the residual risk`);
  }
});

test('Story 5.6 threat model records immutability as security feature and no-hotfix constraint', () => {
  const source = read(threatModelPath);
  const section = sectionFor(source, /immutability/i);

  assert.match(section, /security (feature|property)/i, 'immutability must be described as a security feature');
  assert.match(section, /no[- ]hotfix|no hotfixes|cannot hotfix/i, 'immutability must be described as a no-hotfix constraint');
});

test('Story 5.6 coverage matrix maps every required adversary to existing test files', () => {
  assert.ok(existsSync(coveragePath), 'tests/coverage/threat-model.md must exist');
  const rows = parseMarkdownTable(read(coveragePath));
  assertCitedPathsExist(rows);

  for (const [key] of requiredAttacks) {
    const matchingRows = rows.filter((row) => row.attack.toLowerCase().includes(key));
    assert.ok(matchingRows.length > 0, `coverage matrix must include ${key}`);

    for (const row of matchingRows) {
      assert.ok(row.mitigation.length > 0, `${key} row must include mitigation text`);
    }
  }
});
