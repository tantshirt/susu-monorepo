import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAINNET_BETA_GENESIS_HASH } from '../src/client.js';
import { SusuClusterError, SusuSimulationError } from '../src/errors.js';

const txSig = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as never;
const group = '11111111111111111111111111111111';

const contributeBuilder = vi.hoisted(() => vi.fn((accounts: unknown, args: unknown) => ({ instruction: 'contribute', accounts, args })));

vi.mock('../src/generated/instructions/contribute.js', () => ({
  contribute: contributeBuilder,
}));

function createRpc() {
  return {
    getPriorityFeeEstimate: vi.fn(() => ({ send: vi.fn(async () => ({ priorityFeeEstimate: 1_000 })) })),
    simulateTransaction: vi.fn(() => ({ send: vi.fn(async () => ({ value: { err: null, logs: ['ok'] } })) })),
    sendTransaction: vi.fn(() => ({ send: vi.fn(async () => ({ signature: txSig })) })),
  };
}

describe('simulate-by-default transaction execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('simulation-success path simulates before sending and returns the signature', async () => {
    const rpc = createRpc();
    const { contribute, createSusuClient } = await import('../src/index.js');
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(
      contribute(client, {
        group,
        amount: 50_000_000n,
        rotationIndex: 0,
      }),
    ).resolves.toBe(txSig);

    expect(rpc.simulateTransaction).toHaveBeenCalledTimes(1);
    expect(rpc.sendTransaction).toHaveBeenCalledTimes(1);
    expect(rpc.simulateTransaction.mock.invocationCallOrder[0]).toBeLessThan(rpc.sendTransaction.mock.invocationCallOrder[0]);
  });

  it('simulation-failure path throws SusuSimulationError with logs and never sends', async () => {
    const rpc = createRpc();
    rpc.simulateTransaction.mockReturnValue({
      send: vi.fn(async () => ({
        value: {
          err: { InstructionError: [0, 'Custom'] },
          logs: ['Program log: failed'],
          programLogs: ['Program log: failed'],
        },
      })),
    });
    const { contribute, createSusuClient } = await import('../src/index.js');
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(
      contribute(client, {
        group,
        amount: 50_000_000n,
        rotationIndex: 0,
      }),
    ).rejects.toMatchObject({
      kind: 'simulation',
      logs: ['Program log: failed'],
      programLogs: ['Program log: failed'],
    });
    await expect(
      contribute(client, {
        group,
        amount: 50_000_000n,
        rotationIndex: 0,
      }),
    ).rejects.toBeInstanceOf(SusuSimulationError);
    expect(rpc.sendTransaction).not.toHaveBeenCalled();
  });

  it('simulate: false skips simulation and still returns the send signature', async () => {
    const rpc = createRpc();
    const { contribute, createSusuClient } = await import('../src/index.js');
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(
      contribute(client, {
        group,
        amount: 50_000_000n,
        rotationIndex: 0,
        simulate: false,
      }),
    ).resolves.toBe(txSig);

    expect(rpc.simulateTransaction).not.toHaveBeenCalled();
    expect(rpc.sendTransaction).toHaveBeenCalledTimes(1);
  });

  it('mainnet genesis mismatch throws before transaction build', async () => {
    const rpc = {
      ...createRpc(),
      getGenesisHash: vi.fn(() => ({ send: vi.fn(async () => MAINNET_BETA_GENESIS_HASH) })),
    };
    const { contribute, createSusuClient } = await import('../src/index.js');
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(
      contribute(client, {
        group,
        amount: 50_000_000n,
        rotationIndex: 0,
      }),
    ).rejects.toBeInstanceOf(SusuClusterError);
    expect(contributeBuilder).not.toHaveBeenCalled();
    expect(rpc.simulateTransaction).not.toHaveBeenCalled();
    expect(rpc.sendTransaction).not.toHaveBeenCalled();
  });
});
