//! Story 3.1 — curve golden fixture + `calculate_collateral` integration checks.
//! Run: `cargo test -p susu --test curve`

use std::collections::HashSet;
use std::path::PathBuf;

use serde::Deserialize;
use susu::curve::calculate_collateral;

fn curve_golden_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures/curve-golden.json")
}

#[derive(Debug, Deserialize)]
struct CurveGoldenFixture {
    schema_version: u32,
    cases: Vec<CurveGoldenCase>,
}

#[derive(Debug, Deserialize)]
struct CurveGoldenCase {
    label: String,
    n: u8,
    slot: u8,
    contribution_base_units: u64,
    decimals: u8,
    expected_required_collateral_base_units: u64,
}

/// Vector sizes we commit to covering in the golden file (at least one case each).
const REQUIRED_N_VALUES: &[u8] = &[3, 5, 7, 10, 12];

#[test]
fn curve_golden_fixture_exists_and_matches_calculate_collateral() {
    let path = curve_golden_fixture_path();
    let raw =
        std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {}: {}", path.display(), e));

    let fixture: CurveGoldenFixture = serde_json::from_str(&raw)
        .unwrap_or_else(|e| panic!("parse {} as JSON: {e}", path.display()));

    assert_eq!(
        fixture.schema_version, 1,
        "curve-golden.json schema_version must be 1 (bump only with coordinated cross-lang update)"
    );

    assert!(
        !fixture.cases.is_empty(),
        "fixture must contain at least one case"
    );

    let ns_present: HashSet<u8> = fixture.cases.iter().map(|c| c.n).collect();
    for &n in REQUIRED_N_VALUES {
        assert!(
            ns_present.contains(&n),
            "fixture must include at least one case for n={n}"
        );
    }

    for case in &fixture.cases {
        let got = calculate_collateral(
            case.slot,
            case.n,
            case.contribution_base_units,
            case.decimals,
        )
        .unwrap_or_else(|e| {
            panic!(
                "calculate_collateral failed for label={:?} n={} slot={}: {:?}",
                case.label, case.n, case.slot, e
            )
        });
        assert_eq!(
            got,
            case.expected_required_collateral_base_units,
            "label={:?}",
            case.label
        );
    }
}
