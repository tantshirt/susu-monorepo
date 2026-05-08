# Story 5.3 ATDD: 30% Cartel Scenario

## Scenario 1: Named module is structurally present

Given the Story 5.2 `susu-adversary` crate exists
When Story 5.3 is implemented
Then `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` exists
And it exports `pub fn run(rng: &mut ChaCha20Rng, ctx: &mut SimulatorContext) -> ScenarioResult`
And its doc-comment explains the 10-member, 30% cartel attack in standalone terms.

## Scenario 2: Setup reaches the synchronized default point

Given a deterministic seeded RNG
When the 30% Cartel setup is prepared
Then the circle has exactly 10 members
And the defector cartel is members 4, 5, and 6
And rotations 0, 1, 2, and 3 are funded before member 3 claims the rotation-3 payout
And members 4, 5, and 6 default together at rotation 4.

## Scenario 3: Curve Invariant assertions are explicit

Given the scenario finishes settlement
When the final per-member balances are evaluated
Then honest members 0-3 and 7-9 must have non-negative net P&L
And defector members 4-6 must have negative net P&L
And admin intervention count must be exactly zero.

## Scenario 4: Scenario is part of the adversary report

Given `cargo run --bin susu-adversary -- --circles 10 --seed <64hex> --cluster localnet` runs
When the JSON report is produced
Then `summary.scenarios_covered` includes `"30_percent_cartel"`
And `per_scenario_results` includes a result named `"30_percent_cartel"`.

## Scenario 5: README handoff names the headline attack

Given Epic 8 owns the root README badge cluster
When Story 5.3 lands
Then `crates/susu-adversary/README.md` includes a TODO requiring Epic 8 to add a `30% Cartel` link to the root README badge cluster.
