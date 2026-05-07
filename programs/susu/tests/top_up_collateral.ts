/**
 * Story 3.5 ATDD — integration scenarios (skipped until Anchor/LiteSVM harness + curve/vault prerequisites).
 * Dropout state: simulate reduced `group.n` in fixture setup per story dev notes (Epic 4 defers dropout ix).
 */

type SuiteFn = () => void;

declare function describe(title: string, fn: SuiteFn): void;

declare namespace describe {
  function skip(title: string, fn: SuiteFn): void;
}

declare function it(title: string, fn?: () => Promise<void>): void;

describe.skip("top_up_collateral (Story 3.5 — ATDD red)", () => {
  it("[3.5-INT-001][P0] Simulated post-dropout group.n; top-up meets new_required → vault increases; collateral_posted updated", async () => {
    throw new Error("ATDD scaffold — enable after Story 3.1 curve + vault path");
  });

  it("[3.5-INT-002][P0] Top-up strictly below required delta → InsufficientCollateral", async () => {
    throw new Error("ATDD scaffold — enable after instruction implements InsufficientCollateral path");
  });

  it("[3.5-INT-003][P1] Slashing-rule interaction: dropout triggers dropper collateral slash; survivor new_required reflects post-slash distribution — top-up asserts msg collateral_topped_up", async () => {
    throw new Error("ATDD scaffold — coordinate with Story 3.6 accounting when_dropout path_real");
  });
});
