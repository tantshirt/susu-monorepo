/**
 * Pure TypeScript port of `programs/susu/src/curve.rs`.
 *
 * Closed form (Story 3.1, documented in `docs/collateral-curve.md`):
 *
 *     C_i = contribution * (2 * n - 1 - i)
 *
 * where `i` is the zero-based rotation slot, `n` is the group size
 * (`3 <= n <= 12`), and `contribution` is in display USDC units (or any
 * positive number — the SVG renderer is unitless).
 *
 * This helper is consumed by `<CurveVisualizer />` (Story 7.11 static-svg
 * variant) and the README hero embed (Story 8.1). Story 8.4 reuses the same
 * helper to drive the interactive variant.
 *
 * Pure function — no React, no DOM, no side effects. Returns an array of
 * length `n` with the per-slot collateral.
 */

export const MIN_GROUP_SIZE = 3;
export const MAX_GROUP_SIZE = 12;

export class CurveInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurveInputError";
  }
}

/**
 * Returns the per-slot collateral curve for a group of size `n`.
 *
 * The result is `Array<number>` of length `n`, where index `i` is the
 * collateral required of the recipient at rotation slot `i`.
 *
 * Throws `CurveInputError` when `n` is outside `[3, 12]` or `contribution`
 * is negative / non-finite. Zero contribution is allowed and returns zeros.
 */
export function computeCollateralCurve(n: number, contribution: number): number[] {
  if (!Number.isInteger(n) || n < MIN_GROUP_SIZE || n > MAX_GROUP_SIZE) {
    throw new CurveInputError(
      `n must be an integer in [${MIN_GROUP_SIZE}, ${MAX_GROUP_SIZE}], got ${n}`,
    );
  }
  if (!Number.isFinite(contribution) || contribution < 0) {
    throw new CurveInputError(
      `contribution must be a non-negative finite number, got ${contribution}`,
    );
  }
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    // factor = 2 * n - 1 - i  (range [n, 2n-1] for valid slots)
    const factor = 2 * n - 1 - i;
    out[i] = contribution * factor;
  }
  return out;
}
