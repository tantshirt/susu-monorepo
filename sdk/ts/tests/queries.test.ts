import { describe, expect, it, vi } from 'vitest';
import type { Address } from '@solana/kit';

type MockAccount = Readonly<{
  exists: boolean;
  data: Uint8Array;
}>;

type MockRpc = ReturnType<typeof createMockRpc>;

const groupPda = 'Group111111111111111111111111111111111111' as Address;
const creator = 'Creator1111111111111111111111111111111111' as Address;
const member = 'Member11111111111111111111111111111111111' as Address;
const programId = 'Susu1111111111111111111111111111111111111' as Address;
const groupId = 42n;

const groupFixture = {
  mint: 'Mint1111111111111111111111111111111111111',
  contributionAmount: 50_000_000n,
  n: 5,
  members: [],
  status: { __kind: 'Forming' },
  creator,
  groupId,
  createdAt: 1_768_000_000n,
  curveParams: {},
};

const memberPositionFixture = {
  group: groupPda,
  memberPubkey: member,
  rotationSlot: 3,
  contributionHistory: [{ rotationIndex: 0, paidAt: 1_768_000_100n }],
  collateralPosted: 100_000_000n,
  slashStatus: { __kind: 'None' },
};

function createMockRpc(accounts: Record<string, MockAccount> = {}) {
  const calls: Array<Readonly<{ method: string; args: unknown[] }>> = [];

  return {
    calls,
    getAccountInfo: vi.fn((address: Address) => {
      calls.push({ method: 'getAccountInfo', args: [address] });
      return {
        send: vi.fn(async () => {
          const account = accounts[address];
          return account?.exists ? { value: account } : { value: null };
        }),
      };
    }),
    getProgramAccounts: vi.fn((address: Address, config?: unknown) => {
      calls.push({ method: 'getProgramAccounts', args: [address, config] });
      return {
        send: vi.fn(async () => ({
          value: Object.entries(accounts)
            .filter(([, account]) => account.exists)
            .map(([pubkey, account]) => ({ pubkey, account })),
        })),
      };
    }),
  };
}

async function loadQueriesWithGeneratedDecoderMocks() {
  vi.resetModules();
  vi.doMock('../src/generated/accounts/Group.js', () => ({
    getGroupDecoder: () => ({ decode: vi.fn(() => groupFixture) }),
    decodeGroup: vi.fn(() => groupFixture),
  }));
  vi.doMock('../src/generated/accounts/MemberPosition.js', () => ({
    getMemberPositionDecoder: () => ({ decode: vi.fn(() => memberPositionFixture) }),
    decodeMemberPosition: vi.fn(() => memberPositionFixture),
  }));

  return import('../src/helpers/queries.js');
}

describe.skip('Story 2.6 query helpers ATDD red scaffold', () => {
  it('getGroup returns decoded Group when account exists', async () => {
    const rpc = createMockRpc({
      [groupPda]: { exists: true, data: new Uint8Array([1, 2, 3]) },
    });
    const { getGroup } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getGroup(rpc as MockRpc, groupPda)).resolves.toEqual(groupFixture);
    expect(rpc.getAccountInfo).toHaveBeenCalledWith(groupPda, expect.anything());
  });

  it('getGroup returns undefined when account does not exist', async () => {
    const rpc = createMockRpc();
    const { getGroup } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getGroup(rpc as MockRpc, groupPda)).resolves.toBeUndefined();
  });

  it('getGroupByCreator derives the Group PDA from generated seed constants', async () => {
    const rpc = createMockRpc({
      [groupPda]: { exists: true, data: new Uint8Array([4, 5, 6]) },
    });
    const { getGroupByCreator } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getGroupByCreator(rpc as MockRpc, programId, creator, groupId)).resolves.toEqual(groupFixture);
    expect(rpc.getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it('getMemberPosition returns decoded MemberPosition and undefined when missing', async () => {
    const rpc = createMockRpc({
      [member]: { exists: true, data: new Uint8Array([7, 8, 9]) },
    });
    const { getMemberPosition } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getMemberPosition(rpc as MockRpc, groupPda, member)).resolves.toEqual(memberPositionFixture);
    await expect(getMemberPosition(createMockRpc() as MockRpc, groupPda, member)).resolves.toBeUndefined();
  });

  it('queryParticipationHistory uses a MemberPosition.member_pubkey memcmp filter at offset 40', async () => {
    const rpc = createMockRpc({
      [member]: { exists: true, data: new Uint8Array([10, 11, 12]) },
    });
    const { queryParticipationHistory } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(queryParticipationHistory(rpc as MockRpc, programId, member)).resolves.toEqual([
      {
        group: groupPda,
        rotationSlot: 3,
        contributions: 1,
        slashed: false,
        completed: false,
      },
    ]);
    expect(rpc.calls.find((call) => call.method === 'getProgramAccounts')?.args).toEqual(
      expect.arrayContaining([
        programId,
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({
              memcmp: expect.objectContaining({ offset: 40 }),
            }),
          ]),
        }),
      ]),
    );
  });
});
