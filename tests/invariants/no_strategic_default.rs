use proptest::prelude::*;
use susu::curve::expected_default_payoff;

const CASES: u32 = 10_000;
const MIN_CONTRIBUTION_BASE_UNITS: u64 = 10_000_000;
const MAX_CONTRIBUTION_BASE_UNITS: u64 = 10_000_000_000;

#[derive(Clone, Copy, Debug)]
enum StableMint {
    Usdc,
    Usdt,
}

impl StableMint {
    fn decimals(self) -> u8 {
        match self {
            StableMint::Usdc | StableMint::Usdt => 6,
        }
    }
}

fn no_strategic_default_case() -> impl Strategy<Value = (u8, u8, u64, StableMint)> {
    (3u8..=12).prop_flat_map(|n| {
        (
            Just(n),
            0u8..n,
            MIN_CONTRIBUTION_BASE_UNITS..=MAX_CONTRIBUTION_BASE_UNITS,
            prop_oneof![Just(StableMint::Usdc), Just(StableMint::Usdt)],
        )
    })
}

proptest! {
    #![proptest_config(ProptestConfig {
        cases: CASES,
        failure_persistence: Some(Box::new(proptest::test_runner::FileFailurePersistence::Direct(
            concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../../tests/invariants/no_strategic_default.proptest-regressions"
            ),
        ))),
        ..ProptestConfig::default()
    })]

    #[test]
    fn expected_default_payoff_is_negative_for_every_rotation_slot(
        (n, slot, contribution, mint) in no_strategic_default_case(),
    ) {
        let decimals = mint.decimals();
        let payoff = expected_default_payoff(slot, n, contribution, decimals)
            .expect("valid proptest domain should produce a payoff");

        prop_assert!(
            payoff < 0,
            "n={n} slot={slot} contribution={contribution} decimals={decimals} mint={mint:?} expected_payoff={payoff}"
        );
    }
}
