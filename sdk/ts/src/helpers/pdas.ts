import { type Address, getAddressEncoder, getProgramDerivedAddress, getU64Encoder } from '@solana/kit';

import { GROUP_SEED_BYTES, MEMBER_SEED_BYTES } from '../generated/seeds.js';

export async function deriveGroupPda(
  programId: Address,
  creator: Address,
  groupId: bigint | number,
): Promise<Address> {
  const addressEncoder = getAddressEncoder();
  const [groupPda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [GROUP_SEED_BYTES, addressEncoder.encode(creator), getU64Encoder().encode(groupId)],
  });
  return groupPda;
}

export async function deriveMemberPositionPda(
  programId: Address,
  groupPda: Address,
  member: Address,
): Promise<Address> {
  const addressEncoder = getAddressEncoder();
  const [memberPda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [MEMBER_SEED_BYTES, addressEncoder.encode(groupPda), addressEncoder.encode(member)],
  });
  return memberPda;
}
