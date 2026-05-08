//! Deterministic rotation-slot assignment (Story 4.1).
//!
//! Ranking input is exactly `group_pda || member_pubkey || ROTATION_SLOT_SEED` for each
//! roster member. Sorting those SHA-256 ranks assigns slots `[0, n)` using only committed
//! group state and protocol constants.

use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;

use crate::error::SusuError;
use crate::seeds::ROTATION_SLOT_SEED;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RotationAssignment {
    pub member_pubkey: Pubkey,
    pub slot: u8,
    pub rank: [u8; 32],
}

struct RankedMember {
    member_pubkey: Pubkey,
    rank: [u8; 32],
}

pub fn calculate_rotation_assignments(
    group_pda: Pubkey,
    members: &[Pubkey],
) -> Result<Vec<RotationAssignment>> {
    let n = members.len();
    if !(3..=12).contains(&n) {
        return err!(SusuError::InvalidMemberCount);
    }

    let mut ranked: Vec<RankedMember> = members
        .iter()
        .copied()
        .map(|member_pubkey| RankedMember {
            member_pubkey,
            rank: hashv(&[
                group_pda.as_ref(),
                member_pubkey.as_ref(),
                ROTATION_SLOT_SEED,
            ])
            .to_bytes(),
        })
        .collect();

    ranked.sort_unstable_by(|left, right| {
        left.rank.cmp(&right.rank).then_with(|| {
            left.member_pubkey
                .to_bytes()
                .cmp(&right.member_pubkey.to_bytes())
        })
    });

    ranked
        .into_iter()
        .enumerate()
        .map(|(slot, ranked)| {
            let slot = u8::try_from(slot).map_err(|_| error!(SusuError::InvalidMemberCount))?;
            Ok(RotationAssignment {
                member_pubkey: ranked.member_pubkey,
                slot,
                rank: ranked.rank,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn deterministic_for_same_inputs() {
        let group = Pubkey::new_unique();
        let members: Vec<_> = (0..5).map(|_| Pubkey::new_unique()).collect();

        let first = calculate_rotation_assignments(group, &members).unwrap();
        let second = calculate_rotation_assignments(group, &members).unwrap();

        assert_eq!(first, second);
    }

    #[test]
    fn assigns_each_slot_once() {
        for n in [3_usize, 5, 7, 10, 12] {
            let members: Vec<_> = (0..n).map(|_| Pubkey::new_unique()).collect();
            let assignments =
                calculate_rotation_assignments(Pubkey::new_unique(), &members).unwrap();
            let slots: HashSet<_> = assignments
                .iter()
                .map(|assignment| assignment.slot)
                .collect();

            assert_eq!(assignments.len(), n);
            assert_eq!(slots.len(), n);
            for slot in 0..n as u8 {
                assert!(slots.contains(&slot));
            }
        }
    }
}
