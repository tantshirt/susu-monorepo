use anchor_lang::prelude::*;

use crate::error::SusuError;
use crate::seeds::GROUP_SEED;
use crate::state::{Group, GroupStatus, MemberSlot};

#[derive(Accounts)]
pub struct InviteMembers<'info> {
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = creator,
        seeds = [GROUP_SEED, creator.key().as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump
    )]
    pub group: Account<'info, Group>,
}

#[allow(clippy::redundant_field_names)]
pub fn handler(ctx: Context<InviteMembers>, invitees: Vec<Pubkey>) -> Result<()> {
    let group = &mut ctx.accounts.group;

    require!(
        group.status == GroupStatus::Forming,
        SusuError::GroupAlreadyStarted
    );
    require!(
        invitees.len() == group.n as usize,
        SusuError::InvalidMemberCount
    );

    group.members = invitees
        .into_iter()
        .map(|pubkey| MemberSlot { pubkey: pubkey, accepted: false })
        .collect();

    msg!(
        "members_invited group_pda={} count={}",
        group.key(),
        group.members.len()
    );

    Ok(())
}
