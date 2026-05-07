use anchor_lang::prelude::*;
use instructions::{
    accept_invite::AcceptInvite, cancel_group::CancelGroup, claim_payout::ClaimPayout,
    contribute::Contribute, create_group::CreateGroup, post_collateral::PostCollateral,
    slash_member::SlashMember, top_up_collateral::TopUpCollateral,
    withdraw_collateral::WithdrawCollateral,
};

pub mod error;
pub mod instructions;
pub mod seeds;
pub mod state;

#[allow(unused_imports)]
use instructions::{
    accept_invite::__client_accounts_accept_invite,
    cancel_group::__client_accounts_cancel_group,
    claim_payout::__client_accounts_claim_payout,
    contribute::__client_accounts_contribute,
    create_group::__client_accounts_create_group,
    post_collateral::__client_accounts_post_collateral,
    slash_member::__client_accounts_slash_member,
    top_up_collateral::__client_accounts_top_up_collateral,
    withdraw_collateral::__client_accounts_withdraw_collateral,
};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod susu {
    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
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
        ctx: Context<AcceptInvite>,
        group_id: u64,
    ) -> Result<()> {
        instructions::accept_invite::handler(ctx, group_id)
    }

    pub fn post_collateral(
        ctx: Context<PostCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::post_collateral::handler(ctx, group_id, amount)
    }

    pub fn contribute(
        ctx: Context<Contribute>,
        group_id: u64,
        amount: u64,
        rotation_index: u8,
    ) -> Result<()> {
        instructions::contribute::handler(ctx, group_id, amount, rotation_index)
    }

    pub fn claim_payout(
        ctx: Context<ClaimPayout>,
        group_id: u64,
        rotation_index: u8,
    ) -> Result<()> {
        instructions::claim_payout::handler(ctx, group_id, rotation_index)
    }

    pub fn top_up_collateral(
        ctx: Context<TopUpCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::top_up_collateral::handler(ctx, group_id, amount)
    }

    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        group_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_collateral::handler(ctx, group_id, amount)
    }

    pub fn slash_member(
        ctx: Context<SlashMember>,
        group_id: u64,
        member: Pubkey,
        penalty_amount: u64,
    ) -> Result<()> {
        instructions::slash_member::handler(ctx, group_id, member, penalty_amount)
    }

    pub fn cancel_group(
        ctx: Context<CancelGroup>,
        group_id: u64,
    ) -> Result<()> {
        instructions::cancel_group::handler(ctx, group_id)
    }
}
