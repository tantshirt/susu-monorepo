use anchor_lang::prelude::*;

use crate::error::SusuError;
use crate::instructions::claim_payout::calculate_payout_amount;
use crate::seeds::{GROUP_SEED, ROTATION_SEED};
use crate::state::{Group, GroupStatus, RotationReceipt};

#[derive(Accounts)]
pub struct CompleteGroup<'info> {
    #[account(
        mut,
        seeds = [GROUP_SEED, group.creator.as_ref(), group.group_id.to_le_bytes().as_ref()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,
    pub caller: Signer<'info>,
}

pub fn handler(ctx: Context<CompleteGroup>, group_id: u64) -> Result<()> {
    let group_key = ctx.accounts.group.key();
    let group = &mut ctx.accounts.group;

    require!(group.group_id == group_id, SusuError::GroupIdMismatch);
    complete_group_after_all_rotation_receipts(group_key, group, ctx.remaining_accounts)
}

pub fn complete_group_after_all_rotation_receipts(
    group_key: Pubkey,
    group: &mut Group,
    remaining: &[AccountInfo],
) -> Result<()> {
    require!(
        group.status == GroupStatus::Active,
        SusuError::GroupNotActive
    );
    require!(
        remaining.len() == usize::from(group.n),
        SusuError::InvalidMemberPositionList
    );

    let expected_amount = calculate_payout_amount(group.n, group.contribution_amount)?;

    for rotation_index in 0..group.n {
        let account = &remaining[usize::from(rotation_index)];
        require!(
            account.owner == &crate::ID,
            SusuError::InvalidMemberPositionList
        );

        let expected_receipt = Pubkey::find_program_address(
            &[
                ROTATION_SEED,
                group_key.as_ref(),
                rotation_index.to_le_bytes().as_ref(),
            ],
            &crate::ID,
        )
        .0;
        require!(
            account.key() == expected_receipt,
            SusuError::InvalidMemberPositionList
        );

        let data = account
            .try_borrow_data()
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;
        let mut body: &[u8] = &data;
        let receipt = RotationReceipt::try_deserialize(&mut body)
            .map_err(|_| error!(SusuError::InvalidMemberPositionList))?;

        require!(
            receipt.group == group_key,
            SusuError::InvalidMemberPositionList
        );
        require!(
            receipt.rotation_index == rotation_index,
            SusuError::InvalidMemberPositionList
        );
        require!(
            receipt.amount == expected_amount,
            SusuError::InvalidMemberPositionList
        );
    }

    group.status = GroupStatus::Completed;
    msg!("group_completed: group={}", group_key);

    Ok(())
}
