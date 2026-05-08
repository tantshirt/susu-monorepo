# Story 5.5 ATDD: Collateral Curve Formal Write-Up

## Scenario 1: TL;DR states the Curve Invariant

Given Stories 5.1 and 5.4 are available
When an auditor opens `docs/collateral-curve.md`
Then the first section after the title is `## TL;DR`
And that section restates the Curve Invariant in one paragraph.

## Scenario 2: Formula and derivation match the curve module

Given `programs/susu/src/curve.rs` defines the canonical collateral formula
When the documentation explains strategic default at slot `i`
Then it states `C_i = c(2n - 1 - i)` or equivalent notation
And it derives `expected_default_payoff(i) = (n - 1)c - ic - C_i = -nc < 0`.

## Scenario 3: Worked examples are concrete and checkable

Given a 100 USDC contribution amount
When the documentation presents examples for `n = 3`, `n = 5`, and `n = 10`
Then each table includes formula-derived collateral values
And each table includes the slot-independent default payoff.

## Scenario 4: Evidence paths resolve

Given the public claim cites executable evidence
When the static acceptance test checks cited paths
Then `tests/invariants/no_strategic_default.rs` exists
And `audits/adversary/adversary-report.json` exists
And `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` exists
And the adversary report has `summary.max_defector_profit_lamports == 0`.

## Scenario 5: Comprehension review is recorded

Given the PRD requires non-cryptoeconomist comprehension
When implementation completes
Then the Story 5.5 completion record captures reviewer role, date, summary, and outcome
And the outcome states the reviewer could restate the invariant.
