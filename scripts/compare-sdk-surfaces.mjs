#!/usr/bin/env node
import { readFileSync } from 'node:fs';

function load(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function asSetSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

function diffSection(name, a, b) {
  const sa = new Set(asSetSorted(a));
  const sb = new Set(asSetSorted(b));
  const onlyTs = [...sa].filter((x) => !sb.has(x));
  const onlyRs = [...sb].filter((x) => !sa.has(x));
  if (onlyTs.length === 0 && onlyRs.length === 0) return null;
  return { onlyTs, onlyRs };
}

const tsPath = process.argv[2];
const rsPath = process.argv[3];
if (!tsPath || !rsPath) {
  console.error('usage: compare-sdk-surfaces.mjs <ts-surface.json> <rust-surface.json>');
  process.exit(2);
}

const ts = load(tsPath);
const rs = load(rsPath);

const keys = ['instructions', 'accounts', 'errors'];
let failed = false;
for (const key of keys) {
  const d = diffSection(key, ts[key] ?? [], rs[key] ?? []);
  if (!d) continue;
  failed = true;
  console.error(`SDK surface mismatch (${key}):`);
  if (d.onlyTs.length) console.error(`  only TS: ${d.onlyTs.join(', ')}`);
  if (d.onlyRs.length) console.error(`  only Rust: ${d.onlyRs.join(', ')}`);
}

if (failed) process.exit(1);
