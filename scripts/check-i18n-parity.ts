import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ParityIssue =
  | { locale: string; missing_key: string }
  | { locale: string; extra_key: string };

const messagesDir = resolve(process.env.SUSU_I18N_MESSAGES_DIR ?? 'apps/reference/messages');

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectKeys(value: JsonValue, prefix = '', out = new Set<string>()): Set<string> {
  if (isRecord(value)) {
    for (const key of Object.keys(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      collectKeys(value[key], next, out);
    }
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const next = `${prefix}[${index}]`;
      collectKeys(item, next, out);
    });
    return out;
  }

  if (prefix) {
    out.add(prefix);
  }

  return out;
}

function readJson(filePath: string): JsonValue {
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonValue;
}

let localeFiles: string[] = [];
try {
  if (!statSync(messagesDir).isDirectory()) {
    console.log('check-i18n-parity: vacuously passing (messages directory missing)');
    process.exit(0);
  }
  localeFiles = readdirSync(messagesDir)
    .filter((name) => name.endsWith('.json'))
    .sort();
} catch {
  console.log('check-i18n-parity: vacuously passing (messages directory missing)');
  process.exit(0);
}

if (localeFiles.length === 0) {
  console.log('check-i18n-parity: vacuously passing (no locale json files found)');
  process.exit(0);
}

if (!localeFiles.includes('en.json')) {
  console.error('check-i18n-parity: expected apps/reference/messages/en.json as key baseline');
  process.exit(1);
}

const expectedKeys = collectKeys(readJson(resolve(messagesDir, 'en.json')));
const issues: ParityIssue[] = [];

for (const file of localeFiles) {
  if (file === 'en.json') {
    continue;
  }

  const locale = file.replace(/\.json$/, '');
  const keys = collectKeys(readJson(resolve(messagesDir, file)));
  const missing = [...expectedKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !expectedKeys.has(key));

  missing.forEach((missingKey) => {
    issues.push({ locale, missing_key: missingKey });
  });
  extra.forEach((extraKey) => {
    issues.push({ locale, extra_key: extraKey });
  });
}

if (issues.length > 0) {
  console.error('check-i18n-parity: parity check failed');
  console.error(JSON.stringify(issues, null, 2));
  process.exit(1);
}

console.log('check-i18n-parity: OK');
