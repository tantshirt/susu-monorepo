import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = new URL('../../', import.meta.url);
const repoRootPath = fileURLToPath(repoRoot);

async function commandExists(command) {
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch {
    return false;
  }
}

test('[P0] pnpm install completes for initial workspace scaffold', async (t) => {
  if (!(await commandExists('pnpm'))) {
    t.skip('pnpm is not installed in this environment');
    return;
  }

  const { stdout, stderr } = await execFileAsync('pnpm', ['install'], {
    cwd: repoRootPath,
  });

  assert.ok(stdout !== undefined || stderr !== undefined);
});

test('[P0] cargo metadata resolves workspace', async (t) => {
  if (!(await commandExists('cargo'))) {
    t.skip('cargo is not installed in this environment');
    return;
  }

  const { stdout } = await execFileAsync('cargo', ['metadata', '--format-version', '1'], {
    cwd: repoRootPath,
  });

  assert.match(stdout, /"workspace_members"/);
});
