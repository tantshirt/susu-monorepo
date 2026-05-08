//! Canonical dynamic-collateral curve (Story 3.1).
//!
//! Closed form **O(1)** in arithmetic (parameter `n` is bounded; no iteration over members):
//!
//! `required_collateral(slot, n, contribution) = contribution * (2*n - 1 - slot)`
//!
//! All amounts are SPL **base units** (`contribution` already reflects `mint_decimals`).
//! The `decimals` argument is carried for API parity with future curve extensions (e.g.
//! Story 5.x / Token-2022); it does not change the result today.
//!
//! **Strategic-default sign convention** (used by `docs/collateral-curve.md` and Epic 5):
//! with payout `P(i) = (n-1) * contribution`, contributions paid before payout at slot `i`
//! equal `i * contribution`, this collateral gives
//! `P(i) - i * contribution - C(i) = -n * contribution < 0` for every valid `i`.

use crate::error::SusuError;

/// Returns required collateral in mint base units for rotation `slot`.
pub fn calculate_collateral(
    slot: u8,
    n: u8,
    contribution: u64,
    decimals: u8,
) -> Result<u64, SusuError> {
    let _: u8 = decimals;

    if !(3..=12).contains(&n) {
        return Err(SusuError::InvalidCurveParams);
    }
    // slot >= n is invalid — compare in u8 so review/ATDD can grep the boundary contract.
    if slot >= n {
        return Err(SusuError::InvalidCurveParams);
    }

    let n_u = u64::from(n);
    let slot_u = u64::from(slot);

    // factor = 2*n - 1 - slot  (range [3, 23] for valid n/slot)
    let factor = n_u
        .checked_add(n_u)
        .ok_or(SusuError::CurveOverflow)?
        .checked_sub(1)
        .and_then(|x| x.checked_sub(slot_u))
        .ok_or(SusuError::CurveOverflow)?;

    contribution
        .checked_mul(factor)
        .ok_or(SusuError::CurveOverflow)
}

/// Returns the expected payoff from receiving a payout at `slot` and then defaulting.
///
/// A negative result means strategic default is unprofitable. The calculation intentionally
/// derives collateral through `calculate_collateral` so the invariant follows the canonical
/// curve implementation instead of duplicating its closed form.
pub fn expected_default_payoff(
    slot: u8,
    n: u8,
    contribution: u64,
    decimals: u8,
) -> Result<i128, SusuError> {
    let collateral = i128::from(calculate_collateral(slot, n, contribution, decimals)?);
    let contribution_i = i128::from(contribution);

    let payout = i128::from(n.checked_sub(1).ok_or(SusuError::InvalidCurveParams)?)
        .checked_mul(contribution_i)
        .ok_or(SusuError::CurveOverflow)?;
    let paid_before_payout = i128::from(slot)
        .checked_mul(contribution_i)
        .ok_or(SusuError::CurveOverflow)?;

    payout
        .checked_sub(paid_before_payout)
        .and_then(|net_before_collateral| net_before_collateral.checked_sub(collateral))
        .ok_or(SusuError::CurveOverflow)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_n_low() {
        assert!(matches!(
            calculate_collateral(0, 2, 1_000_000, 6),
            Err(SusuError::InvalidCurveParams)
        ));
    }

    #[test]
    fn invalid_n_high() {
        assert!(matches!(
            calculate_collateral(0, 13, 1_000_000, 6),
            Err(SusuError::InvalidCurveParams)
        ));
    }

    #[test]
    fn invalid_slot() {
        assert!(matches!(
            calculate_collateral(5, 5, 1_000_000, 6),
            Err(SusuError::InvalidCurveParams)
        ));
    }

    #[test]
    fn curve_overflow_when_contribution_times_factor_wraps() {
        let huge = u64::MAX;
        assert!(matches!(
            calculate_collateral(0, 12, huge, 6),
            Err(SusuError::CurveOverflow)
        ));
    }

    #[test]
    fn zero_contribution_returns_zero() {
        assert_eq!(calculate_collateral(0, 5, 0, 6).unwrap(), 0);
    }

    #[test]
    fn last_valid_slot_factor_equals_n() {
        // slot == n - 1 => factor = 2n - 1 - (n-1) = n
        let n = 12u8;
        let slot = n - 1;
        assert_eq!(
            calculate_collateral(slot, n, 50_000_000, 6).unwrap(),
            50_000_000u64 * u64::from(n)
        );
    }

    /// Table: `expected = contribution * (2*n - 1 - slot)` for $50 @ 6dp = 50_000_000.
    #[test]
    fn golden_usdc_50_table() {
        let c = 50_000_000u64;
        let d = 6u8;
        let golden_n3_slot0 = (3u8, 0u8, 250_000_000u64);
        let golden_n3_last = (3u8, 2u8, 150_000_000u64);
        let golden_n5_middle = (5u8, 2u8, 350_000_000u64);
        let golden_n5_slot1 = (5u8, 1u8, 400_000_000u64);
        let golden_n7_first = (7u8, 0u8, 650_000_000u64);
        let golden_n10_last = (10u8, 9u8, 500_000_000u64);
        let golden_n12_middle = (12u8, 6u8, 850_000_000u64);

        let cases: &[(u8, u8, u64)] = &[
            golden_n3_slot0,
            golden_n3_last,
            golden_n5_middle,
            golden_n5_slot1,
            golden_n7_first,
            golden_n10_last,
            golden_n12_middle,
        ];
        for &(n, slot, exp) in cases {
            assert_eq!(
                calculate_collateral(slot, n, c, d).unwrap(),
                exp,
                "n={n} slot={slot}"
            );
        }
    }

    #[test]
    fn golden_synthetic_9_decimals_scales_linearly() {
        let c = 50_000_000_000u64; // $50 at 9 decimals
        let decimals_9 = 9u8;
        assert_eq!(
            calculate_collateral(3, 12, c, decimals_9).unwrap(),
            1_000_000_000_000
        );
    }

    #[test]
    fn expected_default_payoff_is_negative_and_slot_independent_under_current_curve() {
        let n = 5u8;
        let contribution = 50_000_000u64;
        let expected = -i128::from(n) * i128::from(contribution);

        for slot in 0..n {
            assert_eq!(
                expected_default_payoff(slot, n, contribution, 6).unwrap(),
                expected,
                "slot={slot}"
            );
        }
    }

    #[test]
    fn expected_default_payoff_rejects_invalid_curve_params() {
        assert!(matches!(
            expected_default_payoff(3, 3, 50_000_000, 6),
            Err(SusuError::InvalidCurveParams)
        ));
    }
}
