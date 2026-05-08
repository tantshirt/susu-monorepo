import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SusuClusterError,
  SusuError,
  SusuErrorBase,
  SusuRpcError,
  SusuSimulationError,
  isSusuError,
  isSusuProgramError,
  isSusuRpcError,
  isSusuSimulationError,
  type SusuSdkError,
} from '../src/errors.js';

const txSig = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as never;
const group = '11111111111111111111111111111111';

const contributeBuilder = vi.hoisted(() => vi.fn((accounts: unknown, args: unknown) => ({ instruction: 'contribute', accounts, args })));

vi.mock('../src/generated/instructions/contribute.js', () => ({
  contribute: contributeBuilder,
}));

function createRpc() {
  return {
    endpoint: 'https://api.devnet.solana.com',
    getPriorityFeeEstimate: vi.fn(() => ({ send: vi.fn(async () => ({ priorityFeeEstimate: 1_000 })) })),
    simulateTransaction: vi.fn(() => ({ send: vi.fn(async () => ({ value: { err: null, logs: ['ok'] } })) })),
    sendTransaction: vi.fn(() => ({ send: vi.fn(async () => ({ signature: txSig })) })),
  };
}

async function captureContributeError(rpc: ReturnType<typeof createRpc>): Promise<unknown> {
  const { contribute, createSusuClient } = await import('../src/index.js');
  const client = createSusuClient({ cluster: 'devnet', rpc });

  try {
    await contribute(client, {
      group,
      amount: 50_000_000n,
      rotationIndex: 0,
    });
  } catch (error) {
    return error;
  }

  return undefined;
}

describe('typed SDK error taxonomy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decodes Anchor program errors from simulation logs', async () => {
    const rpc = createRpc();
    const anchorLogs = [
      'Program log: Instruction: Contribute',
      'Program log: AnchorError occurred. Error Code: GroupFull. ErrorNumber: 6000. Error Message: The group has reached its maximum member count.',
    ];
    rpc.simulateTransaction.mockReturnValue({
      send: vi.fn(async () => ({
        value: {
          err: { InstructionError: [0, { Custom: 6000 }] },
          logs: anchorLogs,
        },
      })),
    });

    const thrown = await captureContributeError(rpc);

    expect(thrown).toBeInstanceOf(SusuErrorBase);
    expect(thrown).toBeInstanceOf(SusuSimulationError);
    expect(isSusuSimulationError(thrown)).toBe(true);
    expect(thrown).toMatchObject({
      kind: 'simulation',
      logs: anchorLogs,
      programLogs: anchorLogs,
    });
    expect((thrown as SusuSimulationError).cause).toBeInstanceOf(SusuError);
    expect(isSusuProgramError((thrown as SusuSimulationError).cause)).toBe(true);
    expect((thrown as SusuSimulationError).cause).toMatchObject({
      kind: 'program',
      code: 6000,
      name: 'GroupFull',
      instructionName: 'contribute',
      simulationLogs: anchorLogs,
    });
    expect(rpc.sendTransaction).not.toHaveBeenCalled();
  });

  it('keeps non-Anchor simulation failures typed without a decoded cause', async () => {
    const rpc = createRpc();
    const logs = ['Program log: failed before Anchor error decode'];
    const simulationErr = { InstructionError: [0, 'Custom'] };
    rpc.simulateTransaction.mockReturnValue({
      send: vi.fn(async () => ({
        value: {
          err: simulationErr,
          logs,
        },
      })),
    });

    const thrown = await captureContributeError(rpc);

    expect(thrown).toBeInstanceOf(SusuSimulationError);
    expect(thrown).toMatchObject({
      kind: 'simulation',
      logs,
      programLogs: logs,
      error: simulationErr,
    });
    expect((thrown as SusuSimulationError).cause).toBeUndefined();
    expect(rpc.sendTransaction).not.toHaveBeenCalled();
  });

  it('preserves programLogs on decoded program errors when raw logs are absent', async () => {
    const rpc = createRpc();
    const programLogs = [
      'Program log: Instruction: Contribute',
      'Program log: AnchorError occurred. Error Code: GroupFull. ErrorNumber: 6000.',
    ];
    rpc.simulateTransaction.mockReturnValue({
      send: vi.fn(async () => ({
        value: {
          err: { InstructionError: [0, { Custom: 6000 }] },
          logs: [],
          programLogs,
        },
      })),
    });

    const thrown = await captureContributeError(rpc);

    expect(thrown).toBeInstanceOf(SusuSimulationError);
    expect((thrown as SusuSimulationError).cause).toBeInstanceOf(SusuError);
    expect((thrown as SusuSimulationError).cause).toMatchObject({
      kind: 'program',
      code: 6000,
      name: 'GroupFull',
      simulationLogs: programLogs,
    });
  });

  it('wraps RPC timeouts as SusuRpcError', async () => {
    const rpc = createRpc();
    const timeout = { name: 'AbortError', message: 'operation timed out' };
    rpc.simulateTransaction.mockReturnValue({
      send: vi.fn(async () => {
        throw timeout;
      }),
    });

    const thrown = await captureContributeError(rpc);

    expect(thrown).toBeInstanceOf(SusuRpcError);
    expect(isSusuRpcError(thrown)).toBe(true);
    expect(thrown).toMatchObject({
      kind: 'rpc',
      endpoint: 'https://api.devnet.solana.com',
      cause: timeout,
    });
    expect(rpc.sendTransaction).not.toHaveBeenCalled();
  });

  it('narrows typed errors with switch (err.kind)', () => {
    function describeSusuError(err: SusuSdkError): string {
      switch (err.kind) {
        case 'program':
          return `${err.kind}:${err.code}:${err.name}`;
        case 'simulation':
          return `${err.kind}:${err.logs.length}:${err.programLogs.length}`;
        case 'rpc':
          return `${err.kind}:${err.endpoint ?? 'unknown'}:${err.status ?? 'none'}`;
        case 'cluster':
          return `${err.kind}:${err.expected ?? 'unknown'}:${err.actual ?? 'unknown'}`;
      }

      const exhaustive: never = err;
      return exhaustive;
    }

    expect(isSusuError(new SusuRpcError('timeout'))).toBe(true);
    expect(describeSusuError(new SusuError({ code: 6000, name: 'GroupFull' }))).toBe('program:6000:GroupFull');
    expect(describeSusuError(new SusuSimulationError({ logs: ['a'], programLogs: ['b'] }))).toBe('simulation:1:1');
    expect(describeSusuError(new SusuRpcError('timeout', { endpoint: 'https://api.devnet.solana.com' }))).toBe(
      'rpc:https://api.devnet.solana.com:none',
    );
    expect(
      describeSusuError(
        new SusuClusterError('cluster mismatch', {
          reason: 'mainnet-mismatch',
          expected: 'mainnet-beta',
          actual: 'devnet',
        }),
      ),
    ).toBe('cluster:mainnet-beta:devnet');
  });
});
