use std::collections::HashSet;

use anchor_lang::prelude::Pubkey;
use susu::rotation::calculate_rotation_assignments;
use susu::seeds::ROTATION_SLOT_SEED;

fn members(n: u8) -> Vec<Pubkey> {
    (0..n).map(|_| Pubkey::new_unique()).collect()
}

fn slots(assignments: &[susu::rotation::RotationAssignment]) -> Vec<u8> {
    assignments.iter().map(|assignment| assignment.slot).collect()
}

#[test]
fn rotation_assignment_is_byte_reproducible_for_same_group_members_and_seed() {
    let group = Pubkey::new_unique();
    let members = members(5);

    let first = calculate_rotation_assignments(group, &members).expect("first assignment");
    let second = calculate_rotation_assignments(group, &members).expect("second assignment");

    assert_eq!(ROTATION_SLOT_SEED, b"rotation-slot-v1");
    assert_eq!(first, second, "same inputs must produce byte-identical assignments");
}

#[test]
fn rotation_assignment_is_a_bijection_for_supported_group_sizes() {
    for n in [3_u8, 5, 7, 10, 12] {
        let assignments = calculate_rotation_assignments(Pubkey::new_unique(), &members(n))
            .unwrap_or_else(|err| panic!("assignment failed for n={n}: {err:?}"));

        assert_eq!(assignments.len(), usize::from(n));
        let slot_set: HashSet<u8> = slots(&assignments).into_iter().collect();
        assert_eq!(slot_set.len(), usize::from(n), "n={n} must not duplicate slots");
        for expected_slot in 0..n {
            assert!(slot_set.contains(&expected_slot), "n={n} missing slot {expected_slot}");
        }
    }
}

#[test]
fn rotation_assignment_is_domain_separated_by_group_pda() {
    let roster = members(7);
    let first_group = Pubkey::new_unique();
    let second_group = Pubkey::new_unique();

    let first = calculate_rotation_assignments(first_group, &roster).expect("first group");
    let second = calculate_rotation_assignments(second_group, &roster).expect("second group");

    assert_ne!(first_group, second_group);
    assert_ne!(first, second, "different group PDAs must change hash ranking");
}

#[test]
fn rotation_assignment_rejects_unsupported_member_counts() {
    for n in [0_u8, 1, 2, 13] {
        let err = calculate_rotation_assignments(Pubkey::new_unique(), &members(n))
            .expect_err("unsupported n must fail");
        assert_eq!(err.error_name(), "InvalidMemberCount");
    }
}
