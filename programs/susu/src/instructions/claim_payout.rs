use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, ROTATION_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition, RotationReceipt};

#[derive(Accounts)]
#[instruction(group_id: u64, rotation_index: u8)]
pub struct ClaimPayout<'info> {
    #[account(
        mut,
        has_one = mint,
        seeds = [GROUP_SEED, group.creator.as_ref(), group_id.to_le_bytes().as_ref()],
        bump = group.bump,
        constraint = group.group_id == group_id @ SusuError::GroupIdMismatch,
    )]
    pub group: Account<'info, Group>,
    #[account(
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
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [VAULT_SEED, group.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = group,
    )]
    pub vault: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = member,
        seeds = [ROTATION_SEED, group.key().as_ref(), rotation_index.to_le_bytes().as_ref()],
        bump,
        space = 8 + RotationReceipt::INIT_SPACE,
    )]
    pub rotation_receipt: Account<'info, RotationReceipt>,
    #[account(constraint = token_program.key() == Token::id())]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ClaimPayout>, group_id: u64, rotation_index: u8) -> Result<()> {
    let group = &ctx.accounts.group;

    require!(group_id == group.group_id, SusuError::GroupIdMismatch);
    require!(
        group.status == GroupStatus::Active,
        SusuError::GroupNotActive
    );
    require!(
        (rotation_index as usize) < group.n as usize,
        SusuError::InvalidContributionRotation
    );
    assert_rotation_recipient(&ctx.accounts.member_position, rotation_index)?;
    verify_rotation_funded(
        ctx.accounts.group.key(),
        group,
        rotation_index,
        ctx.remaining_accounts,
    )?;

    let close_timestamp = rotation_close_timestamp(
        group.start_timestamp,
        group.contribution_period,
        rotation_index,
    )?;
    assert_rotation_closed(ctx.accounts.clock.unix_timestamp, close_timestamp)?;

    let amount = calculate_payout_amount(group.n, group.contribution_amount)?;
    let decimals = ctx.accounts.mint.decimals;
    let creator = group.creator;
    let gid = group.group_id.to_le_bytes();
    let bump_val = group.bump;
    let seed_slice: &[&[u8]] = &[GROUP_SEED, creator.as_ref(), &gid, &[bump_val]];
    let signer: &[&[&[u8]]] = &[seed_slice];

    #[rustfmt::skip]
    token::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.group.to_account_info(),
            },
            signer,
        ),
        amount,
        decimals,
    )?;

    let receipt = &mut ctx.accounts.rotation_receipt;
    receipt.group = ctx.accounts.group.key();
    receipt.rotation_index = rotation_index;
    receipt.amount = amount;
    receipt.recipient = ctx.accounts.member.key();
    receipt.claimed_at = ctx.accounts.clock.unix_timestamp;
    receipt.bump = ctx.bumps.rotation_receipt;

    msg!(
        "payout_claimed: group={} rotation={} recipient={} amount={}",
        ctx.accounts.group.key(),
        rotation_index,
        ctx.accounts.member.key(),
        amount
    );

    Ok(())
}

pub fn calculate_payout_amount(n: u8, contribution_amount: u64) -> Result<u64> {
    u64::from(n)
        .checked_mul(contribution_amount)
        .ok_or(error!(SusuError::ArithmeticOverflow))
}

pub fn assert_rotation_recipient(
    member_position: &MemberPosition,
    rotation_index: u8,
) -> Result<()> {
    require!(
        member_position.rotation_slot == rotation_index,
        SusuError::NotRotationRecipient
    );

    Ok(())
}

pub fn assert_rotation_closed(clock_unix_timestamp: i64, close_timestamp: i64) -> Result<()> {
    require!(
        clock_unix_timestamp > close_timestamp,
        SusuError::ContributionPeriodOpen
    );

    Ok(())
}

pub fn verify_rotation_funded(
    group_key: Pubkey,
    group: &Group,
    rotation_index: u8,
    remaining: &[AccountInfo],
) -> Result<()> {
    require!(
        remaining.len() == usize::from(group.n),
        SusuError::InvalidMemberPositionList
    );

    for (member_slot, ai) in group.members.iter().zip(remaining.iter()) {
        require!(member_slot.accepted, SusuError::InvalidMemberPositionList);
        require!(ai.owner == &crate::ID, SusuError::InvalidMemberPositionList);

        let data = ai
            .try_borrow_data()
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        let mut body: &[u8] = &data;
        let position = MemberPosition::try_deserialize(&mut body)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;

        require!(
            position.group == group_key,
            SusuError::InvalidMemberPositionList
        );
        require!(
            position.member_pubkey == member_slot.pubkey,
            SusuError::InvalidMemberPositionList
        );

        let expected_member_position = Pubkey::find_program_address(
            &[MEMBER_SEED, group_key.as_ref(), member_slot.pubkey.as_ref()],
            &crate::ID,
        )
        .0;
        require!(
            ai.key() == expected_member_position,
            SusuError::InvalidMemberPositionList
        );

        let idx = rotation_index as usize;
        require!(
            idx < position.contribution_history.len(),
            SusuError::InvalidContributionRotation
        );
        let record = position.contribution_history[idx];
        require!(
            record.rotation_index == rotation_index,
            SusuError::InvalidContributionRotation
        );
        require!(
            record.amount == group.contribution_amount,
            SusuError::ContributionAmountMismatch
        );
    }

    Ok(())
}

pub fn rotation_close_timestamp(
    start_timestamp: i64,
    contribution_period: i64,
    rotation_index: u8,
) -> Result<i64> {
    let completed_periods = i64::from(rotation_index)
        .checked_add(1)
        .ok_or(error!(SusuError::ArithmeticOverflow))?;
    let offset = completed_periods
        .checked_mul(contribution_period)
        .ok_or(error!(SusuError::ArithmeticOverflow))?;
    start_timestamp
        .checked_add(offset)
        .ok_or(error!(SusuError::ArithmeticOverflow))
}
