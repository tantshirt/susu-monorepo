use anchor_lang::prelude::*;

use crate::constants;
use crate::error::SusuError;
use crate::seeds::GROUP_SEED;
use crate::state::{CurveParams, Group, GroupStatus};

#[derive(Accounts)]
#[instruction(group_id: u64)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        seeds = [GROUP_SEED, creator.key().as_ref(), group_id.to_le_bytes().as_ref()],
        bump,
        payer = creator,
        space = 8 + Group::INIT_SPACE
    )]
    pub group: Account<'info, Group>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::manual_range_contains)]
pub fn handler(
    ctx: Context<CreateGroup>,
    group_id: u64,
    n: u8,
    contribution_amount: u64,
    contribution_period: i64,
    mint: Pubkey,
    curve_params: CurveParams,
) -> Result<()> {
    require!(n >= 3 && n <= 12, SusuError::InvalidMemberCount);
    require!(
        constants::is_supported_mint(&mint),
        SusuError::MintNotSupported
    );

    let group = &mut ctx.accounts.group;
    group.mint = mint;
    group.contribution_amount = contribution_amount;
    group.contribution_period = contribution_period;
    group.n = n;
    group.curve_params = curve_params;
    group.members = Vec::new();
    group.status = GroupStatus::Forming;
    group.created_at = Clock::get()?.unix_timestamp;
    group.creator = ctx.accounts.creator.key();
    group.group_id = group_id;
    group.bump = ctx.bumps.group;
    group.start_timestamp = group.created_at;
    group.contribution_window_duration = contribution_period;

    msg!(
        "group_created group_pda={} creator={} n={} mint={} group_id={}",
        group.key(),
        group.creator,
        group.n,
        group.mint,
        group.group_id
    );

    Ok(())
}
