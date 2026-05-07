use anchor_lang::prelude::*;

use crate::state::Group;

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    pub group: Account<'info, Group>,
}

pub fn handler(
    _ctx: Context<CreateGroup>,
    _group_id: u64,
    _contribution_amount: u64,
    _member_count: u8,
    _mint: Pubkey,
    _contribution_period_slots: u64,
    _grace_period_slots: u64,
) -> Result<()> {
    Ok(())
}
