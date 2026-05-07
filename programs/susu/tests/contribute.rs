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

#[test]
fn contribute_source_checks_accepted_members_before_amount_rules() {
    let compact: String = CONTRIBUTE_SOURCE.chars().filter(|c| !c.is_whitespace()).collect();
    assert!(
        compact.contains(".members") && compact.contains(".accepted"),
        "must verify accepted membership on Group.members"
    );
    let membership = compact.find("MemberNotInvited").expect("MemberNotInvited guard");
    let amount_mismatch = compact
        .find("ContributionAmountMismatch")
        .expect("amount validation");
    assert!(
        membership < amount_mismatch,
        "membership guard must precede amount validation"
    );
}

#[test]
fn contribute_source_enforces_outside_window_before_cpi() {
    let compact: String = CONTRIBUTE_SOURCE.chars().filter(|c| !c.is_whitespace()).collect();
    assert!(
        compact.contains("OutsideContributionWindow"),
        "must surface OutsideContributionWindow for bad timing"
    );
    let window = compact.find("OutsideContributionWindow").unwrap();
    let cpi = compact.find("CpiContext::new").unwrap();
    assert!(window < cpi, "window enforcement must precede CPI");
}
