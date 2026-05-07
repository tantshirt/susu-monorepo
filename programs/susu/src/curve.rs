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
    _decimals: u8,
) -> Result<u64, SusuError> {
    if !(3..=12).contains(&n) {
        return Err(SusuError::InvalidCurveParams);
    }
    let n_u = u64::from(n);
    let slot_u = u64::from(slot);
    if slot_u >= n_u {
        return Err(SusuError::InvalidCurveParams);
    }

    // factor = 2*n - 1 - slot  (range [3, 23] for valid n/slot)
    let factor = n_u
        .checked_mul(2)
        .and_then(|x| x.checked_sub(1))
        .and_then(|x| x.checked_sub(slot_u))
        .ok_or(SusuError::CurveOverflow)?;

    contribution
        .checked_mul(factor)
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
        let cases: &[(u8, u8, u64)] = &[
            (3, 0, 250_000_000),
            (3, 2, 150_000_000),
            (5, 2, 350_000_000),
            (5, 1, 400_000_000),
            (7, 0, 650_000_000),
            (10, 9, 500_000_000),
            (12, 6, 850_000_000),
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
        let d = 9u8;
        assert_eq!(
            calculate_collateral(3, 12, c, d).unwrap(),
            1_000_000_000_000
        );
    }
}
