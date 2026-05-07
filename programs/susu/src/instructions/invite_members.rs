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

pub fn handler(ctx: Context<InviteMembers>, invitees: Vec<Pubkey>) -> Result<()> {
    let group = &mut ctx.accounts.group;

    apply_invite_members(group, invitees)?;

    msg!(
        "members_invited group_pda={} count={}",
        group.key(),
        group.members.len()
    );

    Ok(())
}

pub fn apply_invite_members(group: &mut Group, invitees: Vec<Pubkey>) -> Result<()> {
    require!(
        group.status == GroupStatus::Forming,
        SusuError::GroupAlreadyStarted
    );
    require!(
        invitees.len() == group.n as usize,
        SusuError::InvalidMemberCount
    );
    require!(group.members.is_empty(), SusuError::GroupFull);

    group.members = invitees
        .into_iter()
        .map(|pubkey| MemberSlot {
            pubkey,
            accepted: false,
        })
        .collect();

    Ok(())
}
