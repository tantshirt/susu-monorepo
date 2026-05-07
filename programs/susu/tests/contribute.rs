const CONTRIBUTE_SOURCE: &str = include_str!("../src/instructions/contribute.rs");

#[test]
fn contribute_source_emits_contribution_posted_log() {
    assert!(CONTRIBUTE_SOURCE.contains("contribution_posted:"));
    assert!(CONTRIBUTE_SOURCE.contains("anchor_spl"));
    assert!(CONTRIBUTE_SOURCE.contains("transfer"));
}

#[test]
fn contribute_source_orders_active_before_cpi_and_duplicate_before_cpi() {
    let compact: String = CONTRIBUTE_SOURCE.chars().filter(|c| !c.is_whitespace()).collect();
    assert!(
        compact.contains("GroupStatus::Active"),
        "must gate on active groups"
    );
    let active = compact.find("GroupStatus::Active").unwrap();
    let cpi = compact.find("CpiContext::new").unwrap();
    assert!(active < cpi, "active check must precede CPI");
    let dup = compact.find("ContributionAlreadyRecorded").unwrap();
    assert!(dup < cpi, "duplicate guard must precede CPI");
}
