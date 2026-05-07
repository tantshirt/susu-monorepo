use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod seeds;
pub mod state;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod susu {
    use super::*;

    pub fn create_group(
        ctx: Context<instructions::create_group::CreateGroup>,
        group_id: u64,
        contribution_amount: u64,
        member_count: u8,
        mint: Pubkey,
        contribution_period_slots: u64,
        grace_period_slots: u64,
    ) -> Result<()> {
        instructions::create_group::handler(
            ctx,
            group_id,
            contribution_amount,
            member_count,
            mint,
            contribution_period_slots,
            grace_period_slots,
        )
    }

    pub fn accept_invite(
        ctx: Context<instructions::accept_invite::AcceptInvite>,
        group_id: u64,
    ) -> Result<()> {
        instructions::accept_invite::handler(ctx, group_id)
    }

    pub fn post_collateral(
        ctx: Context<instructions::post_collateral::PostCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::post_collateral::handler(ctx, group_id, amount)
    }

    pub fn contribute(
        ctx: Context<instructions::contribute::Contribute>,
        group_id: u64,
        amount: u64,
        rotation_index: u8,
    ) -> Result<()> {
        instructions::contribute::handler(ctx, group_id, amount, rotation_index)
    }

    pub fn claim_payout(
        ctx: Context<instructions::claim_payout::ClaimPayout>,
        group_id: u64,
        rotation_index: u8,
    ) -> Result<()> {
        instructions::claim_payout::handler(ctx, group_id, rotation_index)
    }

    pub fn top_up_collateral(
        ctx: Context<instructions::top_up_collateral::TopUpCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::top_up_collateral::handler(ctx, group_id, amount)
    }

    pub fn withdraw_collateral(
        ctx: Context<instructions::withdraw_collateral::WithdrawCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_collateral::handler(ctx, group_id, amount)
    }

    pub fn slash_member(
        ctx: Context<instructions::slash_member::SlashMember>,
        group_id: u64,
        member: Pubkey,
        penalty_amount: u64,
    ) -> Result<()> {
        instructions::slash_member::handler(ctx, group_id, member, penalty_amount)
    }

    pub fn cancel_group(
        ctx: Context<instructions::cancel_group::CancelGroup>,
        group_id: u64,
    ) -> Result<()> {
        instructions::cancel_group::handler(ctx, group_id)
    }
}
