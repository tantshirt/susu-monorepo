/**
 * Sample circle data for public preview routes.
 */

import type {
  GroupDetailViewModel,
  GroupListItemViewModel,
  RotationViewModel,
} from "./types";

/** Stable sample PDAs for deep links and tests (valid base58 length). */
export const DEMO_GROUP_PRIMARY_PDA =
  "SusuDemo111111111111111111111111111111111111";
export const DEMO_GROUP_SECONDARY_PDA =
  "SusuDemo222222222222222222222222222222222222";

const WEEK_S = 7 * 24 * 60 * 60;

function rotationTemplate(
  i: number,
  n: number,
  recipient: string,
  state: RotationViewModel["state"],
  received: number,
  required: number,
  deadlineOffsetS: number,
  prior: string | null,
): RotationViewModel {
  return {
    i,
    n,
    recipient,
    state,
    contributionsReceived: received,
    contributionsRequired: required,
    claimDeadlineUnix: Math.floor(Date.now() / 1000) + deadlineOffsetS,
    priorClaimSignature: prior,
  };
}

const primaryDetail: GroupDetailViewModel = {
  groupPda: DEMO_GROUP_PRIMARY_PDA,
  name: "Frontier Sample Circle",
  memberCount: 6,
  contributionLabel: "50 USDC",
  mintSymbol: "USDC",
  nextDeadlineUnix: Math.floor(Date.now() / 1000) + WEEK_S,
  isDemo: true,
  collateralSummary:
    "Later turns need more collateral, which helps protect the group if someone stops paying.",
  activeRotationIndex: 0,
  rotations: [
    rotationTemplate(
      1,
      6,
      DEMO_GROUP_PRIMARY_PDA,
      "pending",
      2,
      6,
      WEEK_S,
      null,
    ),
    rotationTemplate(
      2,
      6,
      "Mem222222222222222222222222222222222222222",
      "pending",
      0,
      6,
      WEEK_S * 2,
      null,
    ),
  ],
};

const secondaryDetail: GroupDetailViewModel = {
  groupPda: DEMO_GROUP_SECONDARY_PDA,
  name: "Community ROSCA sample",
  memberCount: 5,
  contributionLabel: "25 USDC",
  mintSymbol: "USDC",
  nextDeadlineUnix: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
  isDemo: true,
  collateralSummary:
    "This sample uses a fixed USDC contribution so the rotation is easy to read.",
  activeRotationIndex: 0,
  rotations: [
    rotationTemplate(
      1,
      5,
      DEMO_GROUP_SECONDARY_PDA,
      "active",
      4,
      5,
      5 * 24 * 60 * 60,
      null,
    ),
  ],
};

const ALL: GroupDetailViewModel[] = [primaryDetail, secondaryDetail];

export function listDemoGroups(): GroupListItemViewModel[] {
  return ALL.map(
    ({
      groupPda,
      name,
      memberCount,
      contributionLabel,
      mintSymbol,
      nextDeadlineUnix,
      isDemo,
    }) => ({
      groupPda,
      name,
      memberCount,
      contributionLabel,
      mintSymbol,
      nextDeadlineUnix,
      isDemo,
    }),
  );
}

export function getDemoGroupDetail(groupPda: string): GroupDetailViewModel | null {
  return ALL.find((g) => g.groupPda === groupPda) ?? null;
}

export function getContributionDefaultsForGroup(groupPda: string): {
  usdcMajor: string;
  amountAtoms: bigint;
} {
  const g = getDemoGroupDetail(groupPda);
  if (!g) {
    return { usdcMajor: "0", amountAtoms: BigInt(0) };
  }
  const major = g.contributionLabel.replace(/\s*USDC\s*$/i, "").trim();
  const parsed = Number.parseFloat(major);
  const usdcMajor = Number.isFinite(parsed) ? major : "0";
  const atoms = Number.isFinite(parsed)
    ? BigInt(Math.round(parsed * 1_000_000))
    : BigInt(0);
  return { usdcMajor, amountAtoms: atoms };
}
