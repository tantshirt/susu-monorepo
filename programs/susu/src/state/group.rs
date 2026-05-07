use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct Group {
    pub mint: Pubkey,
    pub contribution_amount: u64,
    pub contribution_period: i64,
    pub n: u8,
    pub curve_params: CurveParams,
    #[max_len(12)]
    pub members: Vec<MemberSlot>,
    pub status: GroupStatus,
    pub created_at: i64,
    pub creator: Pubkey,
    pub group_id: u64,
    pub bump: u8,
    /// Epoch for rotation window math (set equal to `created_at` at group creation).
    pub start_timestamp: i64,
    /// Inclusive contribution window length for each rotation (seconds).
    pub contribution_window_duration: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default, InitSpace)]
pub struct MemberSlot {
    pub pubkey: Pubkey,
    pub accepted: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, InitSpace)]
pub struct CurveParams {}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, Eq, InitSpace, PartialEq)]
pub enum GroupStatus {
    #[default]
    Forming,
    Active,
    Cancelled,
    Completed,
}
