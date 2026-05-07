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
        _ctx: Context<instructions::create_group::CreateGroup>,
        _group_id: u64,
        _contribution_amount: u64,
        _member_count: u8,
        _mint: Pubkey,
        _contribution_period_slots: u64,
        _grace_period_slots: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn accept_invite(
        _ctx: Context<instructions::accept_invite::AcceptInvite>,
        _group_id: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn post_collateral(
        _ctx: Context<instructions::post_collateral::PostCollateral>,
        _group_id: u64,
        _amount: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn contribute(
        _ctx: Context<instructions::contribute::Contribute>,
        _group_id: u64,
        _amount: u64,
        _rotation_index: u8,
    ) -> Result<()> {
        Ok(())
    }

    pub fn claim_payout(
        _ctx: Context<instructions::claim_payout::ClaimPayout>,
        _group_id: u64,
        _rotation_index: u8,
    ) -> Result<()> {
        Ok(())
    }

    pub fn top_up_collateral(
        _ctx: Context<instructions::top_up_collateral::TopUpCollateral>,
        _group_id: u64,
        _amount: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn withdraw_collateral(
        _ctx: Context<instructions::withdraw_collateral::WithdrawCollateral>,
        _group_id: u64,
        _amount: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn slash_member(
        _ctx: Context<instructions::slash_member::SlashMember>,
        _group_id: u64,
        _member: Pubkey,
        _penalty_amount: u64,
    ) -> Result<()> {
        Ok(())
    }

    pub fn cancel_group(
        _ctx: Context<instructions::cancel_group::CancelGroup>,
        _group_id: u64,
    ) -> Result<()> {
        Ok(())
    }
}
