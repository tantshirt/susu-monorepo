import { describe, expect, it, vi } from 'vitest';
import type { Address } from '@solana/kit';
import { getAddressEncoder } from '@solana/kit';

type MockAccount = Readonly<{
  exists: boolean;
  data: Uint8Array;
}>;

type MockRpc = ReturnType<typeof createMockRpc>;

const groupPda = '11111111111111111111111111111112' as Address;
/** Valid pubkey distinct from groupPda for member-position PDA key in mocks */
const memberPositionPda = 'TokenkegQfeZyiNwAJsbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;
const creator = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' as Address;
const member = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;
const programId = '2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N' as Address;
const groupId = 42n;

const RECORD_LEN = 1 + 8 + 8;

function buildMemberPositionAccountData(opts: Readonly<{
  group: Address;
  member: Address;
  rotationSlot: number;
  contributionRecords: ReadonlyArray<Readonly<{ rotationIndex: number; amount: bigint; paidAt: bigint }>>;
  collateralPosted: bigint;
  slashDiscriminant: number;
}>): Uint8Array {
  const enc = getAddressEncoder();
  const groupBytes = enc.encode(opts.group);
  const memberBytes = enc.encode(opts.member);
  const vecLen = opts.contributionRecords.length;
  const out = new Uint8Array(8 + 32 + 32 + 1 + 4 + vecLen * RECORD_LEN + 8 + 1);
  const dv = new DataView(out.buffer);
  let o = 8;
  out.set(groupBytes, o);
  o += 32;
  out.set(memberBytes, o);
  o += 32;
  out[o] = opts.rotationSlot;
  o += 1;
  dv.setUint32(o, vecLen, true);
  o += 4;
  for (const rec of opts.contributionRecords) {
    out[o] = rec.rotationIndex;
    o += 1;
    dv.setBigUint64(o, rec.amount, true);
    o += 8;
    dv.setBigInt64(o, rec.paidAt, true);
    o += 8;
  }
  dv.setBigUint64(o, opts.collateralPosted, true);
  o += 8;
  out[o] = opts.slashDiscriminant;
  return out;
}

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

function createMockRpc(accounts: Record<string, MockAccount> = {}) {
  const calls: Array<Readonly<{ method: string; args: unknown[] }>> = [];

  return {
    calls,
    getAccountInfo: vi.fn((address: Address) => {
      calls.push({ method: 'getAccountInfo', args: [address] });
      return {
        send: vi.fn(async () => {
          const account = accounts[address];
          return { value: account ?? null };
        }),
      };
    }),
    getProgramAccounts: vi.fn((address: Address, config?: unknown) => {
      calls.push({ method: 'getProgramAccounts', args: [address, config] });
      return {
        send: vi.fn(async () => ({
          value: Object.entries(accounts)
            .filter(([, account]) => account.exists)
            .map(([pubkey, account]) => ({ pubkey: pubkey as Address, account })),
        })),
      };
    }),
  };
}

async function loadQueriesWithGeneratedDecoderMocks() {
  vi.resetModules();
  vi.doMock('../src/generated/accounts/Group.js', () => ({
    getGroupDecoder: vi.fn(() => ({ decode: vi.fn(() => groupFixture) })),
    decodeGroup: vi.fn(() => groupFixture),
  }));
  vi.doMock('../src/generated/accounts/MemberPosition.js', () => ({
    getMemberPositionDecoder: vi.fn(() => ({ decode: vi.fn((data: Uint8Array) => ({ raw: data })) })),
    decodeMemberPosition: vi.fn((data: Uint8Array) => ({ raw: data })),
  }));

  const deriveGroupPda = vi.fn(async () => groupPda);
  const deriveMemberPositionPda = vi.fn(async () => memberPositionPda);
  vi.doMock('../src/helpers/pdas.js', () => ({
    deriveGroupPda,
    deriveMemberPositionPda,
  }));

  const queries = await import('../src/helpers/queries.js');
  return { ...queries, deriveGroupPda, deriveMemberPositionPda };
}

describe('Story 2.6 query helpers', () => {
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
    const { getGroupByCreator, deriveGroupPda } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getGroupByCreator(rpc as MockRpc, programId, creator, groupId)).resolves.toEqual(groupFixture);
    expect(deriveGroupPda).toHaveBeenCalledWith(programId, creator, groupId);
    expect(rpc.getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it('getMemberPosition returns decoded MemberPosition and undefined when missing', async () => {
    const raw = new Uint8Array([7, 8, 9]);
    const rpc = createMockRpc({
      [memberPositionPda]: { exists: true, data: raw },
    });
    const { getMemberPosition, deriveMemberPositionPda } = await loadQueriesWithGeneratedDecoderMocks();

    await expect(getMemberPosition(rpc as MockRpc, programId, groupPda, member)).resolves.toEqual({ raw });
    await expect(getMemberPosition(createMockRpc() as MockRpc, programId, groupPda, member)).resolves.toBeUndefined();
    expect(deriveMemberPositionPda).toHaveBeenCalledWith(programId, groupPda, member);
  });

  it('queryParticipationHistory uses a MemberPosition.member_pubkey memcmp filter at offset 40', async () => {
    const positionData = buildMemberPositionAccountData({
      group: groupPda,
      member,
      rotationSlot: 3,
      contributionRecords: [{ rotationIndex: 0, amount: 50_000_000n, paidAt: 1_768_000_100n }],
      collateralPosted: 100_000_000n,
      slashDiscriminant: 0,
    });
    const rpc = createMockRpc({
      [memberPositionPda]: { exists: true, data: positionData },
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
              memcmp: expect.objectContaining({ offset: 40, bytes: member }),
            }),
          ]),
        }),
      ]),
    );
  });
});
