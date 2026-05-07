use anchor_lang::prelude::*;

use crate::error::SusuError;
use crate::seeds::GROUP_SEED;
use crate::state::{Group, GroupStatus};

#[derive(Accounts)]
pub struct CancelGroup<'info> {
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = creator,
        seeds = [GROUP_SEED, creator.key().as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump
    )]
    pub group: Account<'info, Group>,
}

pub fn apply_cancel_group(group: &mut Group) -> Result<()> {
    require!(
        group.status == GroupStatus::Forming,
        SusuError::GroupAlreadyStarted
    );
    group.status = GroupStatus::Cancelled;

    Ok(())
}

pub fn handler(ctx: Context<CancelGroup>, group_id: u64) -> Result<()> {
    let group = &mut ctx.accounts.group;

    require!(
        group_id == group.group_id,
        anchor_lang::error::ErrorCode::ConstraintSeeds
    );
    apply_cancel_group(group)?;

    msg!("group_cancelled group_pda={} creator={}", group.key(), ctx.accounts.creator.key());

    Ok(())
}
