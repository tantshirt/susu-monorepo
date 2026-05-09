import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CurveInputError,
  MAX_GROUP_SIZE,
  MIN_GROUP_SIZE,
  computeCollateralCurve,
} from "./computeCollateralCurve";

/**
 * Pure-function unit tests for the TypeScript curve port.
 *
 * Runs under `node --test` (the same runner the repo uses for ATDD harnesses).
 * Mirrors the golden table in `programs/susu/src/curve.rs::tests::golden_usdc_50_table`
 * — canonical formula `2 * n - 1 - i`.
 */
describe("computeCollateralCurve", () => {
  it("returns an array of length n", () => {
    assert.equal(computeCollateralCurve(3, 100).length, 3);
    assert.equal(computeCollateralCurve(12, 100).length, 12);
  });

  it("matches the canonical closed form 2 * n - 1 - i", () => {
    const n = 5;
    const c = 100;
    const result = computeCollateralCurve(n, c);
    for (let i = 0; i < n; i++) {
      assert.equal(result[i], c * (2 * n - 1 - i));
    }
  });

  it("matches the curve.rs golden table for $100 contributions", () => {
    // From docs/collateral-curve.md worked examples (zero-indexed slots).
    assert.equal(computeCollateralCurve(3, 100)[0], 500);
    assert.equal(computeCollateralCurve(3, 100)[2], 300);
    assert.equal(computeCollateralCurve(5, 100)[0], 900);
    assert.equal(computeCollateralCurve(5, 100)[4], 500);
    assert.equal(computeCollateralCurve(10, 100)[0], 1900);
    assert.equal(computeCollateralCurve(10, 100)[9], 1000);
  });

  it("returns zeros for zero contribution", () => {
    assert.deepEqual(computeCollateralCurve(7, 0), new Array(7).fill(0));
  });

  it("rejects n below the supported range", () => {
    assert.throws(() => computeCollateralCurve(MIN_GROUP_SIZE - 1, 100), CurveInputError);
  });

  it("rejects n above the supported range", () => {
    assert.throws(() => computeCollateralCurve(MAX_GROUP_SIZE + 1, 100), CurveInputError);
  });

  it("rejects negative contribution", () => {
    assert.throws(() => computeCollateralCurve(5, -1), CurveInputError);
  });

  it("rejects non-integer n", () => {
    assert.throws(() => computeCollateralCurve(5.5, 100), CurveInputError);
  });

  it("collateral strictly decreases across slots (later recipients post less)", () => {
    const curve = computeCollateralCurve(8, 250);
    for (let i = 1; i < curve.length; i++) {
      assert.ok(curve[i]! < curve[i - 1]!);
    }
  });
});
