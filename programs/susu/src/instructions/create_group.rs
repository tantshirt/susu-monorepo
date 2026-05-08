use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants;
use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, VAULT_SEED};
use crate::state::{CurveParams, Group, GroupStatus};

#[derive(Accounts)]
#[instruction(group_id: u64, n: u8, contribution_amount: u64, contribution_period: i64, mint: Pubkey, curve_params: CurveParams)]
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
    #[account(constraint = mint_account.key() == mint @ SusuError::MintNotSupported)]
    pub mint_account: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        seeds = [VAULT_SEED, group.key().as_ref()],
        bump,
        token::mint = mint_account,
        token::authority = group,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(constraint = token_program.key() == Token::id())]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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
    // Allow at least one full contribution period after deadline before slashes.
    group.slash_grace_seconds = contribution_period;

    msg!(
        "group_created group_pda={} creator={} n={} mint={} group_id={} vault={}",
        group.key(),
        group.creator,
        group.n,
        group.mint,
        group.group_id,
        ctx.accounts.vault.key()
    );

    Ok(())
}
