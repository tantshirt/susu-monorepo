//! Story 3.1 — curve golden fixture wiring.
//! Verified via: `cargo test -p susu --test curve`
//! Full vector equality versus `susu::curve::calculate_collateral` belongs in `#[cfg(test)]` inside
//! `programs/susu/src/curve.rs` once the closed-form lands; this integration target only pins the fixture path.

use std::path::PathBuf;

fn curve_golden_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures/curve-golden.json")
}

#[test]
fn curve_golden_fixture_exists_and_contains_cases_shape() {
    let path = curve_golden_fixture_path();
    let raw =
        std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {}: {}", path.display(), e));
    assert!(
        raw.contains("\"schema_version\""),
        "fixture must declare schema_version"
    );
    assert!(raw.contains("\"cases\""), "fixture must expose a cases array");
    for n in ["\"n\": 3", "\"n\": 5", "\"n\": 7", "\"n\": 10", "\"n\": 12"] {
        assert!(
            raw.contains(n),
            "fixture must include at least one case for {}",
            n
        );
    }
}
