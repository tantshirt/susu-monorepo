use anchor_lang::context::CpiContext;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition, SlashStatus};

#[derive(Accounts)]
#[instruction(group_id: u64, amount: u64)]
pub struct WithdrawCollateral<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump,
        constraint = group.group_id == group_id @ SusuError::GroupIdMismatch,
    )]
    pub group: Account<'info, Group>,
    #[account(
        mut,
        seeds = [MEMBER_SEED, group.key().as_ref(), member.key().as_ref()],
        bump,
        constraint = member_position.group == group.key() @ SusuError::MemberPositionMismatch,
        constraint = member_position.member_pubkey == member.key() @ SusuError::MemberPositionMismatch,
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
    #[account(constraint = token_program.key() == Token::id())]
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawCollateral>, _group_id: u64, amount: u64) -> Result<()> {
    let group = &ctx.accounts.group;

    let status_ok = matches!(group.status, GroupStatus::Completed | GroupStatus::Cancelled);
    require!(status_ok, SusuError::GroupNotCompleted);

    require!(
        ctx.accounts.member_position.slash_status != SlashStatus::Slashed,
        SusuError::CollateralForfeited
    );

    let posted = ctx.accounts.member_position.collateral_posted;
    require!(posted > 0, SusuError::CollateralAlreadyWithdrawn);
    require!(
        amount == posted,
        SusuError::ContributionAmountMismatch
    );

    let decimals = ctx.accounts.mint.decimals;
    let creator = group.creator;
    let gid = group.group_id.to_le_bytes();
    let bump_val = group.bump;
    let seed_slice: &[&[u8]] = &[
        GROUP_SEED,
        creator.as_ref(),
        &gid,
        &[bump_val],
    ];
    let signer: &[&[&[u8]]] = &[seed_slice];

    #[rustfmt::skip]
    token::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.member_token_account.to_account_info(),
                authority: ctx.accounts.group.to_account_info(),
            },
            signer,
        ),
        posted,
        decimals,
    )?;

    let mp = &mut ctx.accounts.member_position;
    mp.collateral_posted = 0;

    msg!(
        "collateral_withdrawn: member={} amount={}",
        ctx.accounts.member.key(),
        posted
    );

    Ok(())
}
