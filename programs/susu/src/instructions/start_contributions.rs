use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::error::SusuError;
use crate::seeds::GROUP_SEED;
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
    let clock = Clock::get()?;
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

    for i in 0..usize::from(n) {
        let ai = &remaining[i];
        let mut bd: &[u8] = &ai.try_borrow_data().map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        let deser = MemberPosition::try_deserialize(&mut bd).map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        require!(deser.group == group.key(), SusuError::InvalidMemberPositionList);
        require!(
            group.members[i].pubkey == deser.member_pubkey,
            SusuError::InvalidMemberPositionList
        );
        require!(
            group.members[i].accepted,
            SusuError::InvalidMemberPositionList
        );
        require!(
            deser.rotation_slot == i as u8,
            SusuError::InvalidMemberPositionList
        );
        let req = crate::curve::calculate_collateral(
            deser.rotation_slot,
            n,
            contribution_amount,
            mint_decimals,
        )?;
        require!(
            deser.collateral_posted >= req,
            SusuError::NotAllCollateralized
        );
    }

    group.status = GroupStatus::Active;
    group.start_timestamp = clock.unix_timestamp;

    msg!(
        "group_started: group={} start_timestamp={}",
        group.key(),
        clock.unix_timestamp
    );

    Ok(())
}
