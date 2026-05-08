use anchor_lang::context::CpiContext;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::error::SusuError;
use crate::rotation::calculate_rotation_assignments;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition};

#[derive(Accounts)]
#[instruction(group_id: u64, rotation_slot: u8, amount: u64)]
pub struct PostCollateral<'info> {
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

pub fn handler(
    ctx: Context<PostCollateral>,
    _group_id: u64,
    rotation_slot: u8,
    amount: u64,
) -> Result<()> {
    require!(
        ctx.accounts.group.status == GroupStatus::Forming,
        SusuError::GroupAlreadyStarted
    );

    require!(
        ctx.accounts
            .group
            .members
            .iter()
            .any(|s| s.pubkey == ctx.accounts.member.key() && s.accepted),
        SusuError::MemberNotInvited
    );

    let roster: Vec<Pubkey> = ctx
        .accounts
        .group
        .members
        .iter()
        .map(|slot| slot.pubkey)
        .collect();
    let assignments = calculate_rotation_assignments(ctx.accounts.group.key(), &roster)?;
    let expected_slot = assignments
        .iter()
        .find(|assignment| assignment.member_pubkey == ctx.accounts.member.key())
        .map(|assignment| assignment.slot)
        .ok_or(SusuError::MemberNotInvited)?;

    require!(
        rotation_slot == expected_slot,
        SusuError::InvalidContributionRotation
    );

    let mp = &mut ctx.accounts.member_position;
    require!(
        mp.rotation_slot == u8::MAX || mp.rotation_slot == rotation_slot,
        SusuError::InvalidContributionRotation
    );

    let required = crate::curve::calculate_collateral(
        rotation_slot,
        ctx.accounts.group.n,
        ctx.accounts.group.contribution_amount,
        ctx.accounts.mint.decimals,
    )?;

    let new_total = mp
        .collateral_posted
        .checked_add(amount)
        .ok_or(SusuError::CurveOverflow)?;
    require!(new_total >= required, SusuError::InsufficientCollateral);

    let decimals = ctx.accounts.mint.decimals;
    if amount > 0 {
        #[rustfmt::skip]
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.member_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;
    }

    mp.collateral_posted = new_total;

    msg!(
        "collateral_posted: member={} amount={}",
        ctx.accounts.member.key(),
        amount
    );

    Ok(())
}
