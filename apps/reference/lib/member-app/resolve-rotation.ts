import { getDemoGroupDetail } from "./fixtures";
import type { RotationViewModel } from "./types";

const DEFAULT_OFFSET_S = 7 * 24 * 60 * 60;

/** Fallback when no fixture exists (unknown `groupPda`). */
export function fallbackRotation(groupPda: string): RotationViewModel {
  return {
    i: 1,
    n: 6,
    recipient: groupPda,
    state: "pending",
    contributionsReceived: 0,
    contributionsRequired: 6,
    claimDeadlineUnix: Math.floor(Date.now() / 1000) + DEFAULT_OFFSET_S,
    priorClaimSignature: null,
  };
}

/**
 * Active rotation view for contribute/claim UIs. Fixtures provide data today;
 * swap this module to call the SDK without changing pages.
 */
export function resolveRotationForGroupPda(groupPda: string): RotationViewModel {
  const detail = getDemoGroupDetail(groupPda);
  if (!detail?.rotations.length) {
    return fallbackRotation(groupPda);
  }
  return detail.rotations[detail.activeRotationIndex] ?? detail.rotations[0];
}

/** Zero-based rotation index for `ContributeParams` / `ClaimParams`. */
export function zeroBasedRotationIndex(rotation: RotationViewModel): number {
  return Math.max(0, rotation.i - 1);
}
