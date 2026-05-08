use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::error::SusuError;
use crate::rotation::{calculate_rotation_assignments, RotationAssignment};
use crate::seeds::{GROUP_SEED, MEMBER_SEED};
use crate::state::{Group, GroupStatus, MemberPosition};

#[derive(Accounts)]
pub struct StartContributions<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,
    pub caller: Signer<'info>,
    #[account(constraint = mint.key() == group.mint @ SusuError::MintNotSupported)]
    pub mint: Account<'info, Mint>,
    #[account(constraint = token_program.key() == Token::id())]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<StartContributions>) -> Result<()> {
    let group_key = ctx.accounts.group.key();
    let group = &mut ctx.accounts.group;
    let mint_decimals = ctx.accounts.mint.decimals;

    if group.status != GroupStatus::Forming {
        return err!(SusuError::InvalidStatusTransition);
    }

    let remaining = ctx.remaining_accounts;
    require!(
        remaining.len() == usize::from(group.n),
        SusuError::InvalidMemberPositionList
    );

    let n = group.n;
    let contribution_amount = group.contribution_amount;

    require!(
        group.members.len() == usize::from(n),
        SusuError::InvalidMemberPositionList
    );

    let assignments = assign_rotation_slots_for_start(
        group_key,
        group,
        remaining,
        contribution_amount,
        mint_decimals,
    )?;

    group.status = GroupStatus::Active;
    group.start_timestamp = ctx.accounts.clock.unix_timestamp;

    msg!(
        "group_started: group={} start_timestamp={}",
        group_key,
        ctx.accounts.clock.unix_timestamp
    );
    msg!("slots_assigned: group={}", group_key);
    for assignment in assignments {
        msg!(
            "slots_assigned: member={} slot={}",
            assignment.member_pubkey,
            assignment.slot
        );
    }

    Ok(())
}

pub fn assign_rotation_slots_for_start(
    group_key: Pubkey,
    group: &Group,
    remaining: &[AccountInfo],
    contribution_amount: u64,
    mint_decimals: u8,
) -> Result<Vec<RotationAssignment>> {
    let n = group.n;
    let roster: Vec<Pubkey> = group.members.iter().map(|member| member.pubkey).collect();
    let assignments = calculate_rotation_assignments(group_key, &roster)?;

    for (i, ai) in remaining.iter().enumerate() {
        require!(ai.is_writable, SusuError::InvalidMemberPositionList);
        require!(ai.owner == &crate::ID, SusuError::InvalidMemberPositionList);

        let mut data = ai
            .try_borrow_mut_data()
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        let mut body: &[u8] = &data;
        let mut position = MemberPosition::try_deserialize(&mut body)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;

        require!(
            position.group == group_key,
            SusuError::InvalidMemberPositionList
        );
        let expected_member_position = Pubkey::find_program_address(
            &[MEMBER_SEED, group_key.as_ref(), position.member_pubkey.as_ref()],
            &crate::ID,
        )
        .0;
        require!(
            ai.key() == expected_member_position,
            SusuError::InvalidMemberPositionList
        );
        require!(
            group.members[i].pubkey == position.member_pubkey,
            SusuError::InvalidMemberPositionList
        );
        require!(
            group.members[i].accepted,
            SusuError::InvalidMemberPositionList
        );

        let assignment = assignments
            .iter()
            .find(|assignment| assignment.member_pubkey == position.member_pubkey)
            .ok_or(error!(SusuError::InvalidMemberPositionList))?;

        require!(
            position.rotation_slot == u8::MAX || position.rotation_slot == assignment.slot,
            SusuError::InvalidMemberPositionList
        );
        position.rotation_slot = assignment.slot;

        let req = crate::curve::calculate_collateral(
            position.rotation_slot,
            n,
            contribution_amount,
            mint_decimals,
        )?;
        require!(
            position.collateral_posted >= req,
            SusuError::NotAllCollateralized
        );

        let mut writer: &mut [u8] = &mut data;
        position
            .try_serialize(&mut writer)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
    }

    Ok(assignments)
}
