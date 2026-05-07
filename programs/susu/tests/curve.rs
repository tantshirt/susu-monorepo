//! Story 3.1 — curve golden fixture + `calculate_collateral` integration checks.
//! Run: `cargo test -p susu --test curve`

use std::path::PathBuf;

use susu::curve::calculate_collateral;

fn curve_golden_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures/curve-golden.json")
}

fn u64_field(segment: &str, key_json: &str) -> u64 {
    let i = segment
        .find(key_json)
        .unwrap_or_else(|| panic!("missing {} in segment:\n{segment}", key_json));
    let tail = segment[i + key_json.len()..].trim_start();
    let digits: String = tail
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect();
    digits
        .parse()
        .unwrap_or_else(|_| panic!("bad u64 after {key_json} in {tail}"))
}

fn u8_field(segment: &str, key_json: &str) -> u8 {
    u64_field(segment, key_json) as u8
}

#[test]
fn curve_golden_fixture_exists_and_matches_calculate_collateral() {
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

    for segment in raw.split("\"label\":").skip(1) {
        let segment = segment.splitn(2, '}').next().unwrap_or(segment);
        if !segment.contains("\"n\":") {
            continue;
        }
        let n = u8_field(segment, "\"n\":");
        let slot = u8_field(segment, "\"slot\":");
        let contribution = u64_field(segment, "\"contribution_base_units\":");
        let decimals = u8_field(segment, "\"decimals\":");
        let expected = u64_field(segment, "\"expected_required_collateral_base_units\":");
        let got = calculate_collateral(slot, n, contribution, decimals).unwrap();
        assert_eq!(got, expected);
    }
}
