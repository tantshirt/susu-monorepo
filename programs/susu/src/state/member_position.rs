use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct MemberPosition {
    /// PDA account derived from MEMBER_SEED, the group PDA, and member pubkey.
    pub group: Pubkey,
    pub member_pubkey: Pubkey,
    /// Placeholder set to u8::MAX until Epic 4 assigns deterministic rotation slots.
    pub rotation_slot: u8,
    #[max_len(12)]
    pub contribution_history: Vec<ContributionRecord>,
    pub collateral_posted: u64,
    pub slash_status: SlashStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, InitSpace)]
pub struct ContributionRecord {
    pub rotation_index: u8,
    pub amount: u64,
    pub paid_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, Eq, InitSpace, PartialEq)]
pub enum SlashStatus {
    #[default]
    None,
    Slashed,
    Refunded,
}
