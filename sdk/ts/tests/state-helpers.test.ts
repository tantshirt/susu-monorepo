import { beforeEach, describe, expect, it, vi } from 'vitest';

const txSig = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as never;
const group = '11111111111111111111111111111111';

const builderNames = [
  'createGroup',
  'acceptInvite',
  'postCollateral',
  'contribute',
  'claimPayout',
  'topUpCollateral',
  'withdrawCollateral',
  'cancelGroup',
] as const;

const builderMocks = Object.fromEntries(
  builderNames.map((name) => [name, vi.fn((accounts: unknown, args: unknown) => ({ instruction: name, accounts, args }))]),
) as Record<(typeof builderNames)[number], ReturnType<typeof vi.fn>>;

vi.mock('../src/generated/instructions/createGroup.js', () => ({
  createGroup: builderMocks.createGroup,
}));
vi.mock('../src/generated/instructions/acceptInvite.js', () => ({
  acceptInvite: builderMocks.acceptInvite,
}));
vi.mock('../src/generated/instructions/postCollateral.js', () => ({
  postCollateral: builderMocks.postCollateral,
}));
vi.mock('../src/generated/instructions/contribute.js', () => ({
  contribute: builderMocks.contribute,
}));
vi.mock('../src/generated/instructions/claimPayout.js', () => ({
  claimPayout: builderMocks.claimPayout,
}));
vi.mock('../src/generated/instructions/topUpCollateral.js', () => ({
  topUpCollateral: builderMocks.topUpCollateral,
}));
vi.mock('../src/generated/instructions/withdrawCollateral.js', () => ({
  withdrawCollateral: builderMocks.withdrawCollateral,
}));
vi.mock('../src/generated/instructions/cancelGroup.js', () => ({
  cancelGroup: builderMocks.cancelGroup,
}));

function createRpc() {
  return {
    getPriorityFeeEstimate: vi.fn(() => ({ send: vi.fn(async () => ({ priorityFeeEstimate: 7_500 })) })),
    sendInstructions: vi.fn(() => ({ send: vi.fn(async () => txSig) })),
  };
}

describe('state-changing helper wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [
      'createGroup',
      { creator: group, group, groupId: 1n, n: 5, contributionAmount: 50_000_000n },
      { group },
      { groupId: 1n, n: 5, contributionAmount: 50_000_000n },
    ],
    ['acceptInvite', { group, member: group }, { group, member: group }, {}],
    ['postCollateral', { group, amount: 100_000_000n, rotationSlot: 0 }, { group }, { amount: 100_000_000n, rotationSlot: 0 }],
    ['contribute', { group, amount: 50_000_000n, rotationIndex: 0 }, { group }, { amount: 50_000_000n, rotationIndex: 0 }],
    ['claimPayout', { group, rotationIndex: 0 }, { group }, { rotationIndex: 0 }],
    ['topUpCollateral', { group, amount: 10_000_000n }, { group }, { amount: 10_000_000n }],
    ['withdrawCollateral', { group, amount: 10_000_000n }, { group }, { amount: 10_000_000n }],
    ['cancelGroup', { group, groupId: 1n }, { group }, { groupId: 1n }],
  ] as const)(
    '%s calls the generated builder with expected args and sends a budgeted transaction',
    async (helperName, input, expectedAccounts, expectedArgs) => {
    const rpc = createRpc();
    const sdk = await import('../src/index.js');
    const client = sdk.createSusuClient({ cluster: 'devnet', rpc });

    await expect(sdk[helperName](client, input)).resolves.toBe(txSig);

    expect(builderMocks[helperName]).toHaveBeenCalledTimes(1);
    expect(builderMocks[helperName].mock.calls[0]?.[0]).toEqual(expect.objectContaining(expectedAccounts));
    expect(builderMocks[helperName].mock.calls[0]?.[1]).toEqual(expect.objectContaining(expectedArgs));
    expect(rpc.getPriorityFeeEstimate).toHaveBeenCalledTimes(1);
    expect(rpc.sendInstructions).toHaveBeenCalledTimes(1);

    const sentInstructions = rpc.sendInstructions.mock.calls[0]?.[0] as readonly unknown[];
    expect(sentInstructions).toHaveLength(3);
    expect(sentInstructions[2]).toEqual(expect.objectContaining({ instruction: helperName }));
    expect(rpc.sendInstructions.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        helperName,
        computeUnits: 200_000,
        priorityFee: 7_500n,
      }),
    );
    },
  );

  it('honors compute budget overrides without calling the priority fee estimator', async () => {
    const rpc = createRpc();
    const { contribute, createSusuClient } = await import('../src/index.js');
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await contribute(client, {
      accounts: { group },
      args: { amount: 50_000_000n, rotationIndex: 0 },
      computeUnits: 250_000,
      priorityFee: 99n,
    });

    expect(rpc.getPriorityFeeEstimate).not.toHaveBeenCalled();
    expect(builderMocks.contribute).toHaveBeenCalledWith(
      expect.objectContaining({ group }),
      expect.objectContaining({ amount: 50_000_000n, rotationIndex: 0 }),
    );
    expect(rpc.sendInstructions.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ computeUnits: 250_000, priorityFee: 99n }),
    );
  });
});
