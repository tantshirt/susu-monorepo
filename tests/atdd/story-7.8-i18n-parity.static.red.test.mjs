import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const repoRoot = new URL('../../', import.meta.url);
const repoRootPath = fileURLToPath(repoRoot);
const execFileAsync = promisify(execFile);

async function runParityWith(messagesDir) {
  return execFileAsync(process.execPath, ['scripts/check-i18n-parity.ts'], {
    cwd: repoRootPath,
    env: {
      ...process.env,
      NODE_NO_WARNINGS: '1',
      SUSU_I18N_MESSAGES_DIR: messagesDir,
    },
    maxBuffer: 8 * 1024 * 1024,
  });
}

test('[P1] Story 7.8 parity failures print structured locale/key issues', async () => {
  const root = await mkdtemp(join(tmpdir(), 'i18n-parity-fail-'));
  const messagesDir = join(root, 'messages');

  try {
    await mkdir(messagesDir, { recursive: true });
    await writeFile(
      join(messagesDir, 'en.json'),
      JSON.stringify(
        {
          nav: { home: 'Home', about: 'About' },
          i18n: {
            apples: '{count, plural, one {# apple} other {# apples}}',
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(messagesDir, 'es.json'),
      JSON.stringify(
        {
          nav: { home: 'Inicio', extra: 'Extra' },
          i18n: {
            apples: '{count, plural, one {# manzana} other {# manzanas} many {# manzanas}}',
          },
        },
        null,
        2,
      ),
    );

    await assert.rejects(
      runParityWith(messagesDir),
      (error) => {
        const stderr = `${error.stderr ?? ''}`;
        assert.match(stderr, /check-i18n-parity: parity check failed/);
        const start = stderr.indexOf('[\n');
        assert.notEqual(start, -1, 'stderr should include JSON issue list');
        const issues = JSON.parse(stderr.slice(start));
        assert.deepEqual(issues, [
          { locale: 'es', missing_key: 'nav.about' },
          { locale: 'es', extra_key: 'nav.extra' },
        ]);
        return true;
      },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('[P1] Story 7.8 ICU plural/select branches are ignored for parity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'i18n-parity-icu-'));
  const messagesDir = join(root, 'messages');

  try {
    await mkdir(messagesDir, { recursive: true });
    await writeFile(
      join(messagesDir, 'en.json'),
      JSON.stringify(
        {
          checkout: {
            total: '{count, plural, one {# item} other {# items}}',
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(messagesDir, 'fr.json'),
      JSON.stringify(
        {
          checkout: {
            total: '{count, plural, one {# article} many {# articles} other {# articles}}',
          },
        },
        null,
        2,
      ),
    );

    const { stdout } = await runParityWith(messagesDir);
    assert.match(stdout, /check-i18n-parity: OK/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
