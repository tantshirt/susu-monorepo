//! Instruction builders for the Rust client surface.
//!
//! The committed Codama Rust output is still a fallback stub, so these helpers
//! keep the public names anchored to `generated::instructions` while relying on
//! Anchor's generated `accounts` and `instruction` structs for account metas and
//! data encoding.

use anchor_lang::prelude::Pubkey;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::{InstructionData, ToAccountMetas};

use crate::generated;
use susu::state::CurveParams;

#[derive(Debug, Clone)]
pub struct InstructionBuilder {
    pub kind: generated::instructions::SusuInstructionKind,
    instruction: Instruction,
}

impl InstructionBuilder {
    pub fn new(
        kind: generated::instructions::SusuInstructionKind,
        instruction: Instruction,
    ) -> Self {
        Self { kind, instruction }
    }

    pub fn instruction(&self) -> &Instruction {
        &self.instruction
    }

    pub fn into_instruction(self) -> Instruction {
        self.instruction
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct CreateGroupAccounts {
    pub creator: Pubkey,
    pub group: Pubkey,
    pub mint_account: Pubkey,
    pub vault: Pubkey,
    pub token_program: Pubkey,
    pub system_program: Pubkey,
    pub rent: Pubkey,
}

#[derive(Debug, Clone, Copy)]
pub struct CreateGroupArgs {
    pub group_id: u64,
    pub n: u8,
    pub contribution_amount: u64,
    pub contribution_period: i64,
    pub mint: Pubkey,
    pub curve_params: CurveParams,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct AcceptInviteAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub system_program: Pubkey,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct PostCollateralAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub member_token_account: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct PostCollateralArgs {
    pub group_id: u64,
    pub rotation_slot: u8,
    pub amount: u64,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct ContributeAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub member_token_account: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
    pub clock: Pubkey,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct ContributeArgs {
    pub group_id: u64,
    pub amount: u64,
    pub rotation_index: u8,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ClaimPayoutAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub recipient_token_account: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub rotation_receipt: Pubkey,
    pub token_program: Pubkey,
    pub system_program: Pubkey,
    pub clock: Pubkey,
    pub remaining_member_positions: Vec<Pubkey>,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct ClaimPayoutArgs {
    pub group_id: u64,
    pub rotation_index: u8,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct TopUpCollateralAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub member_token_account: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct TopUpCollateralArgs {
    pub group_id: u64,
    pub amount: u64,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct WithdrawCollateralAccounts {
    pub group: Pubkey,
    pub member_position: Pubkey,
    pub member: Pubkey,
    pub member_token_account: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct WithdrawCollateralArgs {
    pub group_id: u64,
    pub amount: u64,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct CancelGroupAccounts {
    pub creator: Pubkey,
    pub group: Pubkey,
}

fn instruction(
    program_id: Pubkey,
    accounts: Vec<AccountMeta>,
    data: Vec<u8>,
    kind: generated::instructions::SusuInstructionKind,
) -> InstructionBuilder {
    InstructionBuilder::new(kind, Instruction::new_with_bytes(program_id, &data, accounts))
}

pub fn create_group(
    program_id: Pubkey,
    accounts: CreateGroupAccounts,
    args: CreateGroupArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::create_group();
    let metas = susu::accounts::CreateGroup {
        creator: accounts.creator,
        group: accounts.group,
        mint_account: accounts.mint_account,
        vault: accounts.vault,
        token_program: accounts.token_program,
        system_program: accounts.system_program,
        rent: accounts.rent,
    }
    .to_account_metas(None);
    let data = susu::instruction::CreateGroup {
        group_id: args.group_id,
        n: args.n,
        contribution_amount: args.contribution_amount,
        contribution_period: args.contribution_period,
        mint: args.mint,
        curve_params: args.curve_params,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn accept_invite(program_id: Pubkey, accounts: AcceptInviteAccounts) -> InstructionBuilder {
    let kind = generated::instructions::accept_invite();
    let metas = susu::accounts::AcceptInvite {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        system_program: accounts.system_program,
    }
    .to_account_metas(None);
    let data = susu::instruction::AcceptInvite {}.data();
    instruction(program_id, metas, data, kind)
}

pub fn post_collateral(
    program_id: Pubkey,
    accounts: PostCollateralAccounts,
    args: PostCollateralArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::post_collateral();
    let metas = susu::accounts::PostCollateral {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        member_token_account: accounts.member_token_account,
        vault: accounts.vault,
        mint: accounts.mint,
        token_program: accounts.token_program,
    }
    .to_account_metas(None);
    let data = susu::instruction::PostCollateral {
        group_id: args.group_id,
        rotation_slot: args.rotation_slot,
        amount: args.amount,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn contribute(
    program_id: Pubkey,
    accounts: ContributeAccounts,
    args: ContributeArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::contribute();
    let metas = susu::accounts::Contribute {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        member_token_account: accounts.member_token_account,
        vault: accounts.vault,
        mint: accounts.mint,
        token_program: accounts.token_program,
        clock: accounts.clock,
    }
    .to_account_metas(None);
    let data = susu::instruction::Contribute {
        group_id: args.group_id,
        amount: args.amount,
        rotation_index: args.rotation_index,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn claim_payout(
    program_id: Pubkey,
    accounts: ClaimPayoutAccounts,
    args: ClaimPayoutArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::claim_payout();
    let mut metas = susu::accounts::ClaimPayout {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        recipient_token_account: accounts.recipient_token_account,
        vault: accounts.vault,
        mint: accounts.mint,
        rotation_receipt: accounts.rotation_receipt,
        token_program: accounts.token_program,
        system_program: accounts.system_program,
        clock: accounts.clock,
    }
    .to_account_metas(None);
    metas.extend(
        accounts
            .remaining_member_positions
            .iter()
            .map(|position| AccountMeta::new_readonly(*position, false)),
    );
    let data = susu::instruction::ClaimPayout {
        group_id: args.group_id,
        rotation_index: args.rotation_index,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn top_up_collateral(
    program_id: Pubkey,
    accounts: TopUpCollateralAccounts,
    args: TopUpCollateralArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::top_up_collateral();
    let metas = susu::accounts::TopUpCollateral {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        member_token_account: accounts.member_token_account,
        vault: accounts.vault,
        mint: accounts.mint,
        token_program: accounts.token_program,
    }
    .to_account_metas(None);
    let data = susu::instruction::TopUpCollateral {
        group_id: args.group_id,
        amount: args.amount,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn withdraw_collateral(
    program_id: Pubkey,
    accounts: WithdrawCollateralAccounts,
    args: WithdrawCollateralArgs,
) -> InstructionBuilder {
    let kind = generated::instructions::withdraw_collateral();
    let metas = susu::accounts::WithdrawCollateral {
        group: accounts.group,
        member_position: accounts.member_position,
        member: accounts.member,
        member_token_account: accounts.member_token_account,
        vault: accounts.vault,
        mint: accounts.mint,
        token_program: accounts.token_program,
    }
    .to_account_metas(None);
    let data = susu::instruction::WithdrawCollateral {
        group_id: args.group_id,
        amount: args.amount,
    }
    .data();
    instruction(program_id, metas, data, kind)
}

pub fn cancel_group(
    program_id: Pubkey,
    accounts: CancelGroupAccounts,
    group_id: u64,
) -> InstructionBuilder {
    let kind = generated::instructions::cancel_group();
    let metas = susu::accounts::CancelGroup {
        creator: accounts.creator,
        group: accounts.group,
    }
    .to_account_metas(None);
    let data = susu::instruction::CancelGroup { group_id }.data();
    instruction(program_id, metas, data, kind)
}
