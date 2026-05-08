#![allow(unexpected_cfgs)]
#![allow(clippy::diverging_sub_expression)]

use anchor_lang::prelude::*;
use instructions::{
    accept_invite::AcceptInvite, cancel_group::CancelGroup, claim_payout::ClaimPayout,
    complete_group::CompleteGroup, contribute::Contribute, create_group::CreateGroup,
    invite_members::InviteMembers, post_collateral::PostCollateral, slash_member::SlashMember,
    start_contributions::StartContributions, top_up_collateral::TopUpCollateral,
    withdraw_collateral::WithdrawCollateral,
};

pub mod constants;
pub mod curve;
pub mod error;
pub mod instructions;
pub mod rotation;
pub mod seeds;
pub mod state;

#[allow(unused_imports)]
use instructions::{
    accept_invite::__client_accounts_accept_invite, cancel_group::__client_accounts_cancel_group,
    claim_payout::__client_accounts_claim_payout, complete_group::__client_accounts_complete_group,
    contribute::__client_accounts_contribute, create_group::__client_accounts_create_group,
    invite_members::__client_accounts_invite_members,
    post_collateral::__client_accounts_post_collateral,
    slash_member::__client_accounts_slash_member,
    start_contributions::__client_accounts_start_contributions,
    top_up_collateral::__client_accounts_top_up_collateral,
    withdraw_collateral::__client_accounts_withdraw_collateral,
};

declare_id!("2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N");

#[program]
pub mod susu {
    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_id: u64,
        n: u8,
        contribution_amount: u64,
        contribution_period: i64,
        mint: Pubkey,
        curve_params: state::CurveParams,
    ) -> Result<()> {
        instructions::create_group::handler(
            ctx,
            group_id,
            n,
            contribution_amount,
            contribution_period,
            mint,
            curve_params,
        )
    }

    pub fn accept_invite(ctx: Context<AcceptInvite>) -> Result<()> {
        instructions::accept_invite::handler(ctx)
    }

    pub fn invite_members(ctx: Context<InviteMembers>, invitees: Vec<Pubkey>) -> Result<()> {
        instructions::invite_members::handler(ctx, invitees)
    }

    pub fn post_collateral(
        ctx: Context<PostCollateral>,
        group_id: u64,
        rotation_slot: u8,
        amount: u64,
    ) -> Result<()> {
        instructions::post_collateral::handler(ctx, group_id, rotation_slot, amount)
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

    pub fn complete_group(ctx: Context<CompleteGroup>, group_id: u64) -> Result<()> {
        instructions::complete_group::handler(ctx, group_id)
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

    pub fn slash_member<'info>(
        ctx: Context<'info, SlashMember<'info>>,
        group_id: u64,
        member: Pubkey,
        rotation_index: u8,
    ) -> Result<()> {
        instructions::slash_member::handler(ctx, group_id, member, rotation_index)
    }

    pub fn start_contributions(ctx: Context<StartContributions>) -> Result<()> {
        instructions::start_contributions::handler(ctx)
    }

    pub fn cancel_group(ctx: Context<CancelGroup>, group_id: u64) -> Result<()> {
        instructions::cancel_group::handler(ctx, group_id)
    }
}
