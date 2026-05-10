import type { RotationViewModel } from "./types";

const DEFAULT_OFFSET_S = 7 * 24 * 60 * 60;

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
 * Active rotation view for contribute/claim UIs. This is an explicit placeholder
 * until the production indexer provides live rotation state.
 */
export function resolveRotationForGroupPda(groupPda: string): RotationViewModel {
  return fallbackRotation(groupPda);
}

/** Zero-based rotation index for `ContributeParams` / `ClaimParams`. */
export function zeroBasedRotationIndex(rotation: RotationViewModel): number {
  return Math.max(0, rotation.i - 1);
}
