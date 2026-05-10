export function getContributionDefaultsForGroup(groupPda: string): {
  usdcMajor: string;
  amountAtoms: bigint;
} {
  void groupPda;
  return { usdcMajor: "0", amountAtoms: BigInt(0) };
}
