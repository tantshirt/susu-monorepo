#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = path.resolve(repoRoot, process.argv[2] ?? 'sdk/ts/src/generated');

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

async function readSourceFiles(dir, extension) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(extension) || entry.name === 'index.ts') continue;
    const filePath = path.join(dir, entry.name);
    files.push({
      path: filePath,
      source: await fs.readFile(filePath, 'utf8'),
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function collectMatches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

async function extractInstructions() {
  const dir = path.join(generatedDir, 'instructions');
  const files = await readSourceFiles(dir, '.ts');
  return uniqueSorted(files.flatMap(({ source }) => collectMatches(source, /\bexport\s+function\s+([a-z][A-Za-z0-9]*)\s*\(/g)));
}

async function extractAccounts() {
  const dir = path.join(generatedDir, 'accounts');
  const files = await readSourceFiles(dir, '.ts');
  return uniqueSorted(files.flatMap(({ source }) => collectMatches(source, /\bexport\s+type\s+([A-Z][A-Za-z0-9]*)\s*=/g)));
}

async function extractErrors() {
  const source = await readIfExists(path.join(generatedDir, 'errors', 'SusuError.ts'));
  const enumMatch = source.match(/\bexport\s+enum\s+SusuError\s*\{([\s\S]*?)\}/);
  if (!enumMatch) return [];

  return uniqueSorted(
    enumMatch[1]
      .split(/\r?\n/)
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .map((line) => line.match(/^([A-Z][A-Za-z0-9]*)\b/)?.[1])
      .filter(Boolean),
  );
}

async function main() {
  const surface = {
    instructions: await extractInstructions(),
    accounts: await extractAccounts(),
    errors: await extractErrors(),
  };

  process.stdout.write(`${JSON.stringify(surface, null, 2)}\n`);
}

main().catch((error) => {
  console.error(`extract-ts-surface: ${error.message}`);
  process.exitCode = 1;
});
