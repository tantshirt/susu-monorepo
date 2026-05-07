use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition};

#[derive(Accounts)]
#[instruction(group_id: u64)]
pub struct TopUpCollateral<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group_id.to_le_bytes().as_ref()],
        bump = group.bump,
        constraint = group.group_id == group_id @ SusuError::GroupIdMismatch,
    )]
    pub group: Account<'info, Group>,
    #[account(
        mut,
        seeds = [MEMBER_SEED, group.key().as_ref(), member.key().as_ref()],
        bump,
        constraint = member_position.group == group.key() @ SusuError::MemberNotInvited,
        constraint = member_position.member_pubkey == member.key() @ SusuError::MemberNotInvited,
    )]
    pub member_position: Account<'info, MemberPosition>,
    pub member: Signer<'info>,
    #[account(
        mut,
        constraint = member_token_account.owner == member.key(),
        constraint = member_token_account.mint == mint.key(),
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [VAULT_SEED, group.key().as_ref()],
        bump,
        constraint = vault.mint == mint.key(),
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(constraint = mint.key() == group.mint @ SusuError::MintNotSupported)]
    pub mint: Account<'info, Mint>,
    #[account(constraint = token_program.key() == token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<TopUpCollateral>, _group_id: u64, amount: u64) -> Result<()> {
    let group = &ctx.accounts.group;
    if matches!(group.status, GroupStatus::Cancelled) {
        return err!(SusuError::GroupCancelled);
    }
    require!(
        group.status == GroupStatus::Active,
        SusuError::GroupNotActive
    );

    let new_required = crate::curve::calculate_collateral(
        ctx.accounts.member_position.rotation_slot,
        group.n,
        group.contribution_amount,
        ctx.accounts.mint.decimals,
    )?;

    let member_position = &mut ctx.accounts.member_position;
    let new_total = member_position
        .collateral_posted
        .checked_add(amount)
        .ok_or(SusuError::CurveOverflow)?;
    if new_total < new_required {
        return err!(SusuError::InsufficientCollateral);
    }

    if amount > 0 {
        let cpi_accounts = Transfer {
            from: ctx.accounts.member_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.member.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
    }

    member_position.collateral_posted = new_total;

    msg!(
        "collateral_topped_up: member={} additional={} new_total={}",
        ctx.accounts.member.key(),
        amount,
        member_position.collateral_posted
    );

    Ok(())
}
