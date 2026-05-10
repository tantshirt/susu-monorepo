/**
 * Shared view-model types for the reference member app.
 * Demo fixtures implement these shapes; live SDK/Convex wiring can adapt
 * on-chain data into the same interfaces without page refactors.
 */

export type RotationLifecycleState = "pending" | "active" | "claimed";

/** One rotation slot — aligns with `RotationCard` props + claim guards. */
export interface RotationViewModel {
  i: number;
  n: number;
  recipient: string;
  state: RotationLifecycleState;
  contributionsReceived: number;
  contributionsRequired: number;
  claimDeadlineUnix: number;
  priorClaimSignature: string | null;
}

/** Row in the group list / dashboard summary. */
export interface GroupListItemViewModel {
  groupPda: string;
  name: string;
  memberCount: number;
  /** Human label e.g. "50 USDC" */
  contributionLabel: string;
  mintSymbol: string;
  nextDeadlineUnix: number | null;
  isDemo: boolean;
}

/** Full group detail for `/groups/[groupPda]`. */
export interface GroupDetailViewModel extends GroupListItemViewModel {
  rotations: RotationViewModel[];
  /** Zero-based index into `rotations` treated as “current” for UX. */
  activeRotationIndex: number;
  /** Short curve/collateral note for the detail page. */
  collateralSummary: string;
}

/** Default contribution in USDC major units for demo entry fields. */
export interface GroupContributionDefaults {
  usdcMajor: string;
  /** 6 decimals */
  amountAtoms: bigint;
}
