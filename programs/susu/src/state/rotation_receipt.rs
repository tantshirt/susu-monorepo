use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct RotationReceipt {
    /// PDA account derived from ROTATION_SEED, the group PDA, and rotation index bytes.
    pub group: Pubkey,
    pub rotation_index: u8,
    pub amount: u64,
    pub recipient: Pubkey,
    pub claimed_at: i64,
    pub bump: u8,
}
