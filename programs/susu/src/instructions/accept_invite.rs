use anchor_lang::prelude::*;

use crate::state::{Group, MemberPosition};

#[derive(Accounts)]
pub struct AcceptInvite<'info> {
    pub group: Account<'info, Group>,
    pub member_position: Account<'info, MemberPosition>,
}

pub fn handler(_ctx: Context<AcceptInvite>, _group_id: u64) -> Result<()> {
    Ok(())
}
