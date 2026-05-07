import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readRepoFile(path));
}

async function assertFileExists(path) {
  await access(new URL(path, repoRoot));
}

async function listInstructionRustFiles() {
  const dir = new URL('programs/susu/src/instructions/', repoRoot);
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.rs'))
    .map((e) => `programs/susu/src/instructions/${e.name}`)
    .sort();
}

function stripLineComments(source) {
  return source.replace(/\/\/.*$/gm, '');
}

/** Remove string literals so heuristic scans do not confuse doc examples with production code. */
function stripRustStrings(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i + 1 < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i = Math.min(i + 2, source.length);
      continue;
    }
    if (ch === 'b' && source[i + 1] === '"') {
      i += 2;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      out += ' ';
      continue;
    }
    if (ch === 'r' && source[i + 1] === '#' && source[i + 2] === '"') {
      i += 3;
      while (i + 2 < source.length && !(source[i] === '"' && source[i + 1] === '#' && source[i + 2] === '#')) i += 1;
      i = Math.min(i + 3, source.length);
      out += ' ';
      continue;
    }
    if (ch === '"') {
      i += 1;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      out += ' ';
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function productionCurveSource(source) {
  const withoutTests = source.replace(/#\[cfg\s*\(\s*test\s*\)\][\s\S]*?(?=(?:#\[cfg|\z))/g, '');
  return stripRustStrings(stripLineComments(withoutTests));
}

test('[P0] curve.rs exposes calculate_collateral with Story 3.1 signature', async () => {
  await assertFileExists('programs/susu/src/curve.rs');
  const source = await readRepoFile('programs/susu/src/curve.rs');
  const prod = productionCurveSource(source);

  assert.match(
    prod,
    /pub\s+fn\s+calculate_collateral\s*\(\s*slot\s*:\s*u8\s*,\s*n\s*:\s*u8\s*,\s*contribution\s*:\s*u64\s*,\s*decimals\s*:\s*u8\s*\)\s*->\s*Result\s*<\s*u64\s*,\s*(?:crate::error::)?SusuError\s*>/,
    'calculate_collateral must use the canonical public signature returning Result<u64, SusuError>',
  );

  assert.doesNotMatch(prod, /\bf(?:32|64)\b/, 'curve math must not use floating point');
});

test('[P0] curve.rs uses checked_add, checked_mul, checked_sub without saturating or wrapping helpers', async () => {
  const source = await readRepoFile('programs/susu/src/curve.rs');
  const prod = productionCurveSource(source);

  for (const op of ['checked_add', 'checked_mul', 'checked_sub']) {
    assert.match(prod, new RegExp(`\\b${op}\\b`), `curve arithmetic must call ${op} in production code`);
  }
  assert.doesNotMatch(
    /\bsaturating_(?:add|sub|mul|div)\b/,
    source,
    'curve.rs must not use saturating_* helpers',
  );
  assert.doesNotMatch(
    /\bwrapping_(?:add|sub|mul)\b/,
    source,
    'curve.rs must not use wrapping_* helpers',
  );
});

test('[P0] curve.rs maps arithmetic None to CurveOverflow via checked operations', async () => {
  const source = await readRepoFile('programs/susu/src/curve.rs');
  const prod = productionCurveSource(source);

  assert.match(prod, /\bCurveOverflow\b/, 'overflow paths must surface SusuError::CurveOverflow');
  assert.ok(
    /\.ok_or(?:_else)?\s*\(\s*[^)]*CurveOverflow/.test(prod) ||
      /Some\([^)]*\)\)\s*=>\s*[^,]+,\s*None\s*=>\s*Err\s*\(\s*[^\)]*CurveOverflow/.test(prod.replace(/\s+/g, '')),
    'checked None results must convert to CurveOverflow (e.g. ok_or(ok_or_else) or explicit None branch)',
  );
});

test('[P0] curve.rs validates n in [3, 12] and slot < n with InvalidCurveParams', async () => {
  const source = await readRepoFile('programs/susu/src/curve.rs');
  const prod = productionCurveSource(source);

  assert.match(prod, /\bInvalidCurveParams\b/, 'invalid inputs must surface InvalidCurveParams');

  assert.ok(/n\s*>=\s*3/.test(prod) || /\b3\s*\.\.=\s*12\b/.test(prod), 'n lower bound guard (>= 3 / range) required');

  assert.ok(/n\s*<=\s*12\b/.test(prod) || /\b3\s*\.\.=\s*12\b/.test(prod), 'n upper bound guard (<= 12 / inclusive range) required');

  assert.ok(
    /slot\s*<\s*n\b/.test(prod) || /slot\s*>=\s*n\b/.test(prod),
    'slot versus n boundary check required',
  );
});

test('[P0] curve.rs avoids iterative member/slot scans in production code', async () => {
  const source = await readRepoFile('programs/susu/src/curve.rs');
  const prod = productionCurveSource(source);

  assert.doesNotMatch(prod, /\bfor\s+/, 'closed-form curve must avoid for-loops outside tests');
  assert.doesNotMatch(prod, /\bwhile\b/, 'closed-form curve must avoid while-loops outside tests');
  assert.doesNotMatch(prod, /\.for_each\b/, 'closed-form curve must avoid iterator scans outside tests');
});

test('[P0] curve.rs #[cfg(test)] golden module covers each Story 3.1 n bound plus decimals 9', async () => {
  const source = await readRepoFile('programs/susu/src/curve.rs');

  assert.match(source, /#\[cfg\s*\(\s*test\s*\)\]\s*mod\s+tests\b/, 'curve.rs must expose #[cfg(test)] mod tests');

  const modMatch = source.match(/#\[cfg\s*\(\s*test\s*\)\]\s*mod\s+tests\b\s*\{/);
  assert.ok(modMatch, 'curve.rs must declare a tests module body');

  const modStart = source.indexOf(modMatch[0]);
  const body = source.slice(modStart);
  const testsCount = [...body.matchAll(/\#\[test\]/g)].length;
  assert.ok(testsCount >= 5, `expected at least five #[test] golden rows, found ${testsCount}`);

  for (const n of [3, 5, 7, 10, 12]) {
    assert.ok(
      body.includes(`"${n}"`) ||
        new RegExp(`\\bn\\s*[:=\\),]\\s*${n}\\b`).test(body) ||
        body.includes(`golden_n${n}_`) ||
        body.includes(`golden_vector_n${n}`) ||
        body.includes(`case_n${n}_`),
      `tests module must visibly reference the n=${n} membership size row`,
    );
  }

  assert.ok(
    /50_000_000|\\b50000000\b|contribution_base_units|50M/.test(body),
    'golden tests must anchor the $50 nominal contribution base units (Story 3.1)',
  );
  assert.ok(
    /\bu8::from\s*\(\s*9\s*\)|decimals:\s*9|dec_9|decimals_9\b/.test(body),
    'golden tests must exercise a 9-decimal mint scalar',
  );
});

test('[P0] Susu program exports curve module from lib.rs', async () => {
  const lib = await readRepoFile('programs/susu/src/lib.rs');
  assert.match(lib, /pub\s+mod\s+curve\s*;/, 'lib.rs must export pub mod curve;');
});

test('[P0] SusuError defines CurveOverflow and InvalidCurveParams', async () => {
  const err = await readRepoFile('programs/susu/src/error.rs');

  assert.match(err, /\bCurveOverflow\b[\s\S]*?\#\[msg\("[^"]+"\)\]/, 'CurveOverflow variant with message required');
  assert.match(err, /\bInvalidCurveParams\b[\s\S]*?\#\[msg\("[^"]+"\)\]/, 'InvalidCurveParams variant with message required');
});

test('[P0] curve-golden.json fixture matches parity contract schema', async () => {
  const doc = await readJson('tests/fixtures/curve-golden.json');

  assert.equal(doc.schema_version, 1);
  assert.ok(Array.isArray(doc.cases), 'fixture must expose cases[]');
  const ns = new Set(doc.cases.map((c) => c.n));

  for (const n of [3, 5, 7, 10, 12]) {
    assert.ok(ns.has(n), `fixture must contain at least one case with n=${n}`);
  }

  assert.ok(doc.cases.some((c) => c.decimals === 9), 'fixture must cover a decimals=9 synthetic mint');
});

test('[P1] curve integration test crate reads the shared fixture', async () => {
  await assertFileExists('programs/susu/tests/curve.rs');
  const source = await readRepoFile('programs/susu/tests/curve.rs');
  assert.match(source, /\bcargo test -p susu --test curve\b|fixture|curve-golden/i, 'curve integration scaffold should anchor the golden JSON path');

  assert.match(source, /\#\[test\]/, 'curve.rs integration harness must expose at least one #[test]');
});

test('[P1] instruction handlers do not reimplement calculate_collateral or checked curve ladder', async () => {
  for (const path of await listInstructionRustFiles()) {
    const source = await readRepoFile(path);
    assert.doesNotMatch(
      source,
      /\bcalculate_collateral\b/,
      `${path} must route collateral math via crate::curve once Story 3.1 lands, not duplicate the symbol locally`,
    );
  }
});
