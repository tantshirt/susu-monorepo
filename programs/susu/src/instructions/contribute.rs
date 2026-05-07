use anchor_lang::context::CpiContext;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition, SlashStatus};

#[derive(Accounts)]
#[instruction(group_id: u64, amount: u64, rotation_index: u8)]
pub struct Contribute<'info> {
    #[account(
        mut,
        has_one = mint,
        seeds = [GROUP_SEED, group.creator.as_ref(), group_id.to_le_bytes().as_ref()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,
    #[account(
        mut,
        seeds = [MEMBER_SEED, group.key().as_ref(), member.key().as_ref()],
        bump,
    )]
    pub member_position: Account<'info, MemberPosition>,
    #[account(mut)]
    pub member: Signer<'info>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = member,
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [VAULT_SEED, group.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = group,
    )]
    pub vault: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<Contribute>,
    _group_id: u64,
    amount: u64,
    rotation_index: u8,
) -> Result<()> {
    require!(
        ctx.accounts.group.status == GroupStatus::Active,
        SusuError::GroupNotActive
    );

    require!(
        ctx.accounts.member_position.slash_status != SlashStatus::Slashed,
        SusuError::MemberSlashedCannotContribute
    );

    let group = &ctx.accounts.group;
    require!(
        (rotation_index as usize) < group.n as usize,
        SusuError::InvalidContributionRotation
    );

    let idx = rotation_index as usize;
    require!(
        idx < ctx.accounts.member_position.contribution_history.len(),
        SusuError::InvalidContributionRotation
    );

    let now = ctx.accounts.clock.unix_timestamp;
    let window_open = (rotation_index as i64)
        .checked_mul(group.contribution_period)
        .and_then(|off| group.start_timestamp.checked_add(off))
        .ok_or(error!(SusuError::InvalidContributionRotation))?;
    let window_close = window_open
        .checked_add(group.contribution_window_duration)
        .ok_or(error!(SusuError::InvalidContributionRotation))?;
    require!(
        now >= window_open && now <= window_close,
        SusuError::OutsideContributionWindow
    );

    let record = ctx.accounts.member_position.contribution_history[idx];
    require!(
        record.amount == 0,
        SusuError::ContributionAlreadyRecorded
    );
    require!(
        record.rotation_index == rotation_index,
        SusuError::InvalidContributionRotation
    );

    require!(
        amount == group.contribution_amount,
        SusuError::ContributionAmountMismatch
    );

    token::transfer(
        CpiContext::new(
            token::ID,
            Transfer {
                from: ctx.accounts.member_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.member.to_account_info(),
            },
        ),
        amount,
    )?;

    let member_position = &mut ctx.accounts.member_position;
    member_position.contribution_history[idx].amount = amount;
    member_position.contribution_history[idx].paid_at = now;

    msg!(
        "contribution_posted: member={} rotation={} amount={}",
        ctx.accounts.member.key(),
        rotation_index,
        amount
    );

    Ok(())
}
