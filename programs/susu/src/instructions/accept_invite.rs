use anchor_lang::prelude::*;

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED};
use crate::state::{Group, GroupStatus, MemberPosition, SlashStatus};

#[derive(Accounts)]
pub struct AcceptInvite<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump
    )]
    pub group: Account<'info, Group>,
    #[account(
        init,
        seeds = [MEMBER_SEED, group.key().as_ref(), member.key().as_ref()],
        bump,
        payer = member,
        space = 8 + MemberPosition::INIT_SPACE
    )]
    pub member_position: Account<'info, MemberPosition>,
    #[account(mut)]
    pub member: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcceptInvite>) -> Result<()> {
    let group = &mut ctx.accounts.group;

    apply_accept_invite(group, ctx.accounts.member.key())?;

    let member_position = &mut ctx.accounts.member_position;
    member_position.group = group.key();
    member_position.member_pubkey = ctx.accounts.member.key();
    // TODO(epic-4-story-4-1): replace with deterministic slot assignment.
    member_position.rotation_slot = u8::MAX;
    member_position.collateral_posted = 0;
    member_position.contribution_history = Vec::new();
    member_position.slash_status = SlashStatus::None;

    msg!(
        "member_accepted group_pda={} member={}",
        group.key(),
        ctx.accounts.member.key()
    );

    Ok(())
}

pub fn apply_accept_invite(group: &mut Group, member_pubkey: Pubkey) -> Result<()> {
    validate_accept_invite_group(group)?;

    let slot = group
        .members
        .iter_mut()
        .find(|member_slot| member_slot.pubkey == member_pubkey)
        .ok_or(error!(SusuError::MemberNotInvited))?;

    accept_member_slot(slot)
}

fn validate_accept_invite_group(group: &Group) -> Result<()> {
    if matches!(group.status, GroupStatus::Cancelled) {
        return err!(SusuError::GroupCancelled);
    }
    require!(
        matches!(group.status, GroupStatus::Forming),
        SusuError::GroupAlreadyStarted
    );

    Ok(())
}

fn accept_member_slot(slot: &mut crate::state::MemberSlot) -> Result<()> {
    if slot.accepted {
        return err!(SusuError::AlreadyAccepted);
    }

    slot.accepted = true;

    Ok(())
}
