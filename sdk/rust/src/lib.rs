//! Rust client SDK for Susu Protocol.
//!
//! `generated` remains the Codama fallback surface from Story 1.3. Story 6.4
//! layers account decoding, PDA derivation, errors, and ergonomic client
//! builders around that generated module.

pub mod accounts;
pub mod client;
pub mod errors;
pub mod generated;
pub mod instructions;
pub mod pdas;
pub mod queries;

pub use accounts::{
    decode_group, decode_member_position, decode_rotation_receipt, ContributionRecord, CurveParams,
    Group, GroupStatus, MemberPosition, MemberSlot, RotationReceipt, SlashStatus,
};
pub use client::{Cluster, SusuClient, DEFAULT_COMPUTE_UNITS, DEFAULT_SUSU_PROGRAM_ID};
pub use errors::{SusuError, SusuProgramError};
pub use instructions::{
    AcceptInviteAccounts, CancelGroupAccounts, ClaimPayoutAccounts, ClaimPayoutArgs,
    ContributeAccounts, ContributeArgs, CreateGroupAccounts, CreateGroupArgs, InstructionBuilder,
    PostCollateralAccounts, PostCollateralArgs, TopUpCollateralAccounts, TopUpCollateralArgs,
    WithdrawCollateralAccounts, WithdrawCollateralArgs,
};
pub use pdas::{group_pda, member_pda, rotation_history_pda, rotation_receipt_pda, vault_pda, Pda};
pub use queries::{
    get_group, get_group_by_creator, get_member_position, query_participation_history,
    ParticipationRecord,
};
