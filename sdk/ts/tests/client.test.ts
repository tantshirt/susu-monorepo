import { describe, expect, it, vi } from 'vitest';

import {
  cluster,
  createSusuClient,
  DEFAULT_COMPUTE_UNITS,
  signer,
  solanaDevnetRpc,
  SusuClientConfigError,
  SusuTransactionSendError,
} from '../src/client.js';
import { SusuClusterError } from '../src/errors.js';

const mockSigner = { address: '11111111111111111111111111111111' };

describe('Susu fluent client', () => {
  it('composes signer and devnet RPC plugins through .use(plugin)', () => {
    const rpc = { sendInstructions: vi.fn() };
    const client = createSusuClient({ cluster: 'devnet' })
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

  it('lets plugins clear compute budget overrides back to defaults', () => {
    const rpc = { sendInstructions: vi.fn() };
    const base = createSusuClient({ cluster: 'devnet', rpc, computeUnits: 250_000, priorityFee: 7_500n });
    const unchanged = base.use(() => ({}));
    const cleared = base.use(() => ({ computeUnits: undefined, priorityFee: undefined }));

    expect(unchanged.computeUnits).toBe(250_000);
    expect(unchanged.priorityFee).toBe(7_500n);
    expect(cleared.computeUnits).toBe(DEFAULT_COMPUTE_UNITS);
    expect(cleared.priorityFee).toBeUndefined();
  });

  it('throws a typed config error when helpers run without cluster or rpc', async () => {
    const { contribute } = await import('../src/helpers/contribute.js');

    expect(() => createSusuClient(undefined as never)).toThrow(SusuClusterError);
    expect(() => createSusuClient({} as never)).toThrow(SusuClusterError);
    expect(() => createSusuClient({ cluster: '' as never })).toThrow(SusuClusterError);
    await expect(contribute(createSusuClient({ cluster: 'devnet' }), { amount: 1n })).rejects.toBeInstanceOf(
      SusuClientConfigError,
    );
  });

  it('rejects mainnet-resolved RPC endpoints unless cluster is explicitly mainnet-beta', () => {
    const mainnetRpc = {
      endpoint: 'https://api.mainnet-beta.solana.com',
      sendTransaction: vi.fn(),
      simulateTransaction: vi.fn(),
    };

    expect(() => createSusuClient({ cluster: 'devnet', rpc: mainnetRpc })).toThrow(SusuClusterError);
    expect(() => createSusuClient({ cluster: 'mainnet-beta', rpc: mainnetRpc })).not.toThrow();
  });

  it('explicit mainnet-beta success for known mainnet endpoints', () => {
    const mainnetRpc = {
      endpoint: 'https://mainnet.helius-rpc.com/?api-key=test',
      sendTransaction: vi.fn(),
      simulateTransaction: vi.fn(),
    };

    const client = createSusuClient({ cluster: 'mainnet-beta', rpc: mainnetRpc });

    expect(client.cluster).toBe('mainnet-beta');
    expect(client.rpc).toBe(mainnetRpc);
  });

  it('rejects standard RPC proxy methods that are not explicit Susu send hooks', async () => {
    const proxyMethod = vi.fn();
    const proxyRpc = new Proxy(
      {},
      {
        get: () => proxyMethod,
      },
    );
    const client = createSusuClient({ cluster: 'devnet', rpc: proxyRpc });
    const { contribute } = await import('../src/index.js');

    await expect(
      contribute(client, {
        amount: 1n,
        simulate: false,
      }),
    ).rejects.toBeInstanceOf(SusuTransactionSendError);
    expect(proxyMethod).not.toHaveBeenCalled();
  });
});
