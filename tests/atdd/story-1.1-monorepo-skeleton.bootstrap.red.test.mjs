import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// RED phase scaffold: remove `.skip` when Story 1.1 implementation begins.
test.skip('[P0] pnpm install completes for initial workspace scaffold', async () => {
  const { stdout, stderr } = await execFileAsync('pnpm', ['install'], {
    cwd: new URL('../../../../', import.meta.url),
  });

  assert.ok(stdout !== undefined || stderr !== undefined);
});

// RED phase scaffold: remove `.skip` when Story 1.1 implementation begins.
test.skip('[P0] cargo metadata resolves workspace', async () => {
  const { stdout } = await execFileAsync('cargo', ['metadata', '--format-version', '1'], {
    cwd: new URL('../../../../', import.meta.url),
  });

  assert.match(stdout, /"workspace_members"/);
});
