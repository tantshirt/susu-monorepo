use anchor_lang::context::CpiContext;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::SusuError;
use crate::seeds::{GROUP_SEED, MEMBER_SEED, VAULT_SEED};
use crate::state::{Group, GroupStatus, MemberPosition, SlashStatus};

#[derive(Accounts)]
#[instruction(group_id: u64, defector_pubkey: Pubkey, rotation_index: u8)]
pub struct SlashMember<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump,
        constraint = group.group_id == group_id @ SusuError::GroupIdMismatch,
    )]
    pub group: Account<'info, Group>,
    #[account(
        mut,
        seeds = [VAULT_SEED, group.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = group,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [
            MEMBER_SEED,
            group.key().as_ref(),
            defector_pubkey.as_ref(),
        ],
        bump,
        constraint = defector_position.group == group.key() @ SusuError::MemberPositionMismatch,
        constraint = defector_position.member_pubkey == defector_pubkey @ SusuError::MemberPositionMismatch,
    )]
    pub defector_position: Account<'info, MemberPosition>,
    pub caller: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub clock: Sysvar<'info, Clock>,
    #[account(constraint = token_program.key() == Token::id())]
    pub token_program: Program<'info, Token>,
}

pub fn handler<'info>(
    ctx: Context<'info, SlashMember<'info>>,
    _group_id: u64,
    defector_pubkey: Pubkey,
    rotation_index: u8,
) -> Result<()> {
    let group_ai = ctx.accounts.group.key();
    let group = &ctx.accounts.group;
    require!(group.status == GroupStatus::Active, SusuError::GroupNotActive);
    require!(
        (rotation_index as usize) < group.n as usize,
        SusuError::InvalidContributionRotation
    );

    let defector_key = ctx.accounts.defector_position.member_pubkey;
    require!(defector_key == defector_pubkey, SusuError::MemberPositionMismatch);

    let def_pos = &ctx.accounts.defector_position;
    require!(
        def_pos.slash_status != SlashStatus::Slashed,
        SusuError::AlreadySlashed
    );

    let ri = rotation_index as usize;
    require!(
        ri < def_pos.contribution_history.len(),
        SusuError::InvalidContributionRotation
    );
    require!(
        def_pos.contribution_history[ri].rotation_index == rotation_index,
        SusuError::InvalidContributionRotation
    );
    require!(
        def_pos.contribution_history[ri].amount == 0,
        SusuError::CannotSlashContributor
    );

    let now = ctx.accounts.clock.unix_timestamp;
    let window_open = (rotation_index as i64)
        .checked_mul(group.contribution_period)
        .and_then(|off| group.start_timestamp.checked_add(off))
        .ok_or(SusuError::InvalidContributionRotation)?;
    let window_close = window_open
        .checked_add(group.contribution_window_duration)
        .ok_or(SusuError::InvalidContributionRotation)?;
    let slash_after = window_close
        .checked_add(group.slash_grace_seconds)
        .ok_or(SusuError::InvalidContributionRotation)?;
    require!(now > slash_after, SusuError::WithinGracePeriod);

    let slashed_amount = crate::curve::calculate_collateral(
        def_pos.rotation_slot,
        group.n,
        group.contribution_amount,
        ctx.accounts.mint.decimals,
    )?;

    let ra = ctx.remaining_accounts;
    require!(ra.len() % 2 == 0, SusuError::InvalidMemberPositionList);
    require!(ra.len() >= 2, SusuError::InvalidMemberPositionList);

    #[derive(Clone)]
    struct Honest {
        weight: u128,
        ata_index: usize,
    }

    let mut honest: Vec<Honest> = Vec::with_capacity(ra.len() / 2);

    for (pair_idx, pair) in ra.chunks_exact(2).enumerate() {
        let pos_ai = &pair[0];
        let ata_ai = &pair[1];
        let mut pdata: &[u8] = &pos_ai
            .try_borrow_data()
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        let pos = MemberPosition::try_deserialize(&mut pdata)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        require!(pos.group == group_ai, SusuError::InvalidMemberPositionList);
        require!(
            pos.member_pubkey != defector_key,
            SusuError::InvalidMemberPositionList
        );
        require!(
            pos.slash_status != SlashStatus::Slashed,
            SusuError::InvalidMemberPositionList
        );
        let pri = rotation_index as usize;
        require!(pri < pos.contribution_history.len(), SusuError::InvalidMemberPositionList);
        require!(
            pos.contribution_history[pri].rotation_index == rotation_index,
            SusuError::InvalidContributionRotation
        );
        require!(
            pos.contribution_history[pri].amount > 0,
            SusuError::CannotSlashContributor
        );

        let ata = Account::<TokenAccount>::try_from(ata_ai)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        require!(ata.owner == pos.member_pubkey, SusuError::InvalidMemberPositionList);
        require!(ata.mint == group.mint, SusuError::MintNotSupported);

        let factor = u64::from(group.n)
            .checked_add(u64::from(group.n))
            .ok_or(SusuError::CurveOverflow)?
            .checked_sub(1)
            .ok_or(SusuError::CurveOverflow)?
            .checked_sub(u64::from(pos.rotation_slot))
            .ok_or(SusuError::CurveOverflow)?;
        let weight = factor as u128;
        honest.push(Honest {
            weight,
            ata_index: pair_idx * 2 + 1,
        });
    }

    require!(!honest.is_empty(), SusuError::InvalidMemberPositionList);

    let total_w: u128 = honest.iter().map(|h| h.weight).sum();
    require!(total_w > 0, SusuError::InvalidMemberPositionList);

    let gid = ctx.accounts.group.group_id.to_le_bytes();
    let bump_val = ctx.accounts.group.bump;
    let creator = ctx.accounts.group.creator;
    let seed_slice: &[&[u8]] = &[
        GROUP_SEED,
        creator.as_ref(),
        &gid,
        &[bump_val],
    ];
    let signer: &[&[&[u8]]] = &[seed_slice];

    let vault_ai = ctx.accounts.vault.to_account_info();
    let authority_ai = ctx.accounts.group.to_account_info();
    let token_program_id = ctx.accounts.token_program.key();

    let mut distributed: u64 = 0;
    let hn = honest.len();

    let vault_balance = ctx.accounts.vault.amount;
    require!(
        vault_balance >= slashed_amount,
        SusuError::InsufficientCollateral
    );

    for (i, h) in honest.iter().enumerate() {
        let share_raw = ((slashed_amount as u128)
            .checked_mul(h.weight)
            .ok_or(SusuError::CurveOverflow)?
            / total_w) as u64;
        let share = if i + 1 == hn {
            slashed_amount
                .checked_sub(distributed)
                .ok_or(SusuError::CurveOverflow)?
        } else {
            share_raw
        };
        distributed = distributed.checked_add(share).ok_or(SusuError::CurveOverflow)?;

        if share == 0 {
            continue;
        }

        let ata_ai = &ra[h.ata_index];

        #[rustfmt::skip]
        token::transfer(
            CpiContext::new_with_signer(
                token_program_id,
                Transfer {
                    from: vault_ai.clone(),
                    to: ata_ai.to_account_info(),
                    authority: authority_ai.clone(),
                },
                signer,
            ),
            share,
        )?;
    }

    ctx.accounts.defector_position.slash_status = SlashStatus::Slashed;

    msg!(
        "member_slashed: defector={} amount={} rotation_index={}",
        defector_key,
        slashed_amount,
        rotation_index
    );

    Ok(())
}
