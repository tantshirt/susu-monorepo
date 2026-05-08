# Collateral Curve

## TL;DR

The Curve Invariant is that a member who has already received the group payout cannot profit by strategically defaulting afterward: for every valid rotation slot `i`, group size `n`, and positive contribution `c`, `expected_default_payoff(i) < 0`. Susu enforces that by requiring collateral `C_i = c(2n - 1 - i)`, so the payout minus already-paid contributions minus collateral simplifies to `-nc`, which is strictly negative.

## Formula

Let:

- `n` be the group size, with `3 <= n <= 12`.
- `i` be the recipient's zero-based rotation slot, with `0 <= i < n`.
- `c` be the per-round contribution in mint base units or display USDC units.
- `C_i` be the collateral required for slot `i`.

The collateral curve is `C_i = c(2n - 1 - i)`. Equivalently, in LaTeX notation: `$C_i = c(2n - 1 - i)$`.

This is the same closed form used by `programs/susu/src/curve.rs`.

## Derivation

At slot `i`, the recipient can observe three quantities:

- Payout received at the slot: `(n - 1)c`.
- Contributions already paid before receiving the payout: `ic`.
- Collateral posted for that slot: `C_i`.

The strategic-default payoff convention used by the code is:

`expected_default_payoff(i) = (n - 1)c - ic - C_i`.

Substitute the curve definition:

`expected_default_payoff(i) = (n - 1)c - ic - c(2n - 1 - i)`.

Factor out `c`:

`expected_default_payoff(i) = c[(n - 1) - i - (2n - 1 - i)]`.

Cancel `-i` and `+i`:

`expected_default_payoff(i) = c[n - 1 - 2n + 1] = -nc`.

Because valid groups have `n >= 3` and a real contribution has `c > 0`, `-nc < 0`. Therefore `expected_default_payoff(i) = -n * c < 0` for every valid slot.

## Worked Examples

These examples use a contribution of `$100 USDC` per round. USDC has 6 decimals on chain, so `$100 USDC` is `100_000_000` base units; the display values below use whole USDC for readability.

| n | slot | contribution | required collateral | expected default payoff |
| --- | --- | --- | --- | --- |
| 3 | 0 | $100 USDC | $500 USDC | $-300 USDC |
| 3 | 2 | $100 USDC | $300 USDC | $-300 USDC |
| 5 | 0 | $100 USDC | $900 USDC | $-500 USDC |
| 5 | 4 | $100 USDC | $500 USDC | $-500 USDC |
| 10 | 0 | $100 USDC | $1900 USDC | $-1000 USDC |
| 10 | 9 | $100 USDC | $1000 USDC | $-1000 USDC |

The required collateral declines for later slots because late recipients have paid more contributions before receiving their payout. The expected default payoff remains slot-independent under this curve because the collateral decrease exactly offsets the larger amount already paid in.

## Proof Sketch

Assumptions:

- The participant is evaluating a single strategic default immediately after receiving the payout at a valid slot `i`.
- The group size `n` is valid, meaning `3 <= n <= 12`.
- The contribution `c` is positive and denominated consistently with the collateral amount.
- The payout is `(n - 1)c`, excluding the recipient's own current-round contribution.
- The protocol can seize posted collateral after default according to the implemented slashing path.

For any valid slot, the only slot-dependent terms in the default payoff are `-ic` and `-C_i`. The curve sets `C_i = c(2n - 1 - i)`, so moving to a later slot reduces collateral by exactly `c` per slot while the member has also paid exactly one additional contribution per slot. Those two slot-dependent effects cancel.

After cancellation, the payoff is always `-nc`. Since `n` and `c` are positive in the valid domain, the expression is strictly negative. That proves the informal invariant for the modeled one-shot strategic default: a rational member does not gain value by taking the payout and defaulting instead of continuing.

This is a proof sketch rather than a full mechanized proof. The executable invariant test at `tests/invariants/no_strategic_default.rs` checks the same sign condition over randomized valid inputs, and the adversary artifact at `audits/adversary/adversary-report.json` records the current simulation evidence with `summary.max_defector_profit_lamports == 0`.

## Verification Artifacts

- `programs/susu/src/curve.rs` is the canonical curve implementation.
- `tests/invariants/no_strategic_default.rs` is the property-test evidence for `expected_default_payoff(i) < 0`.
- `audits/adversary/adversary-report.json` is the canonical adversary report evidence for the current simulation run.
