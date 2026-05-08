import { beforeEach, describe, expect, it, vi } from 'vitest';

const group = '11111111111111111111111111111111';
const member = '11111111111111111111111111111112';
const programId = '2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N';

const queryMocks = vi.hoisted(() => ({
  getGroup: vi.fn(),
  getMemberPosition: vi.fn(),
  queryParticipationHistory: vi.fn(),
}));

vi.mock('../src/helpers/queries.js', () => ({
  getGroup: queryMocks.getGroup,
  getMemberPosition: queryMocks.getMemberPosition,
  queryParticipationHistory: queryMocks.queryParticipationHistory,
}));

describe('client read helper wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getGroup delegates to generated account query decoding with the client RPC', async () => {
    queryMocks.getGroup.mockResolvedValue({ raw: new Uint8Array([1]) });
    const { createSusuClient, getGroup } = await import('../src/index.js');
    const rpc = { getAccountInfo: vi.fn(), getProgramAccounts: vi.fn() };
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(getGroup(client, group as never)).resolves.toEqual({ raw: new Uint8Array([1]) });
    expect(queryMocks.getGroup).toHaveBeenCalledWith(rpc, group);
  });

  it('getMemberPosition derives and queries with the client program id by default', async () => {
    queryMocks.getMemberPosition.mockResolvedValue({ raw: new Uint8Array([2]) });
    const { createSusuClient, getMemberPosition } = await import('../src/index.js');
    const rpc = { getAccountInfo: vi.fn(), getProgramAccounts: vi.fn() };
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(getMemberPosition(client, { group: group as never, member: member as never })).resolves.toEqual({
      raw: new Uint8Array([2]),
    });
    expect(queryMocks.getMemberPosition).toHaveBeenCalledWith(rpc, programId, group, member);
  });

  it('queryHistory delegates to participation history and supports simple pagination', async () => {
    queryMocks.queryParticipationHistory.mockResolvedValue([
      { group: 'a', rotationSlot: 0, contributions: 1, slashed: false, completed: false },
      { group: 'b', rotationSlot: 1, contributions: 1, slashed: false, completed: true },
      { group: 'c', rotationSlot: 2, contributions: 0, slashed: true, completed: false },
    ]);
    const { createSusuClient, queryHistory } = await import('../src/index.js');
    const rpc = { getAccountInfo: vi.fn(), getProgramAccounts: vi.fn() };
    const client = createSusuClient({ cluster: 'devnet', rpc });

    await expect(queryHistory(client, { wallet: member as never, before: 'c' as never, limit: 1 })).resolves.toEqual([
      { group: 'a', rotationSlot: 0, contributions: 1, slashed: false, completed: false },
    ]);
    await expect(queryHistory(client, { wallet: member as never, limit: 0 })).resolves.toEqual([]);
    expect(queryMocks.queryParticipationHistory).toHaveBeenCalledWith(rpc, programId, member);
  });
});
