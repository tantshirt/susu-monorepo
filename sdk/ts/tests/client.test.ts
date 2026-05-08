import { describe, expect, it, vi } from 'vitest';

import { cluster, createSusuClient, DEFAULT_COMPUTE_UNITS, signer, solanaDevnetRpc, SusuClientConfigError } from '../src/client.js';

const mockSigner = { address: '11111111111111111111111111111111' };

describe('Susu fluent client', () => {
  it('composes signer and devnet RPC plugins through .use(plugin)', () => {
    const rpc = { sendInstructions: vi.fn() };
    const client = createSusuClient()
      .use(signer(mockSigner as never))
      .use(solanaDevnetRpc({ rpc }))
      .use(cluster('devnet'));

    expect(client.signer).toBe(mockSigner);
    expect(client.rpc).toBe(rpc);
    expect(client.cluster).toBe('devnet');
    expect(client.computeUnits).toBe(DEFAULT_COMPUTE_UNITS);
    expect(client.programId).toBe('2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N');
  });

  it('keeps the original client immutable when applying plugins', () => {
    const base = createSusuClient({ cluster: 'localnet' });
    const withRpc = base.use(solanaDevnetRpc({ rpc: { sendInstructions: vi.fn() } }));

    expect(base.rpc).toBeUndefined();
    expect(base.cluster).toBe('localnet');
    expect(withRpc.cluster).toBe('devnet');
    expect(withRpc.rpc).toBeDefined();
  });

  it('throws a typed config error when helpers run without cluster or rpc', async () => {
    const { contribute } = await import('../src/helpers/contribute.js');

    await expect(contribute(createSusuClient(), { amount: 1n })).rejects.toBeInstanceOf(SusuClientConfigError);
    await expect(contribute(createSusuClient({ cluster: 'devnet' }), { amount: 1n })).rejects.toBeInstanceOf(
      SusuClientConfigError,
    );
  });
});
