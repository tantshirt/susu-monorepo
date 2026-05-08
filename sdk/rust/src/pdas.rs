//! Canonical PDA derivation helpers.

use anchor_lang::prelude::Pubkey;

pub use susu::seeds::{GROUP_SEED, MEMBER_SEED, ROTATION_SEED, VAULT_SEED};

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct Pda {
    pub address: Pubkey,
    pub bump: u8,
}

fn find(seeds: &[&[u8]], program_id: &Pubkey) -> Pda {
    let (address, bump) = Pubkey::find_program_address(seeds, program_id);
    Pda { address, bump }
}

pub fn group_pda(program_id: &Pubkey, creator: &Pubkey, group_id: u64) -> Pda {
    let group_id_bytes = group_id.to_le_bytes();
    find(
        &[GROUP_SEED, creator.as_ref(), group_id_bytes.as_ref()],
        program_id,
    )
}

pub fn member_pda(program_id: &Pubkey, group: &Pubkey, member: &Pubkey) -> Pda {
    find(&[MEMBER_SEED, group.as_ref(), member.as_ref()], program_id)
}

pub fn vault_pda(program_id: &Pubkey, group: &Pubkey) -> Pda {
    find(&[VAULT_SEED, group.as_ref()], program_id)
}

pub fn rotation_receipt_pda(program_id: &Pubkey, group: &Pubkey, rotation_index: u8) -> Pda {
    let rotation_index_bytes = rotation_index.to_le_bytes();
    find(
        &[ROTATION_SEED, group.as_ref(), rotation_index_bytes.as_ref()],
        program_id,
    )
}

pub fn rotation_history_pda(program_id: &Pubkey, group: &Pubkey, rotation_index: u8) -> Pda {
    rotation_receipt_pda(program_id, group, rotation_index)
}
