use anchor_lang::prelude::*;

use crate::state::{Group, RotationReceipt};

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    pub group: Account<'info, Group>,
    pub rotation_receipt: Account<'info, RotationReceipt>,
}

pub fn handler(
    _ctx: Context<ClaimPayout>,
    _group_id: u64,
    _rotation_index: u8,
) -> Result<()> {
    Ok(())
}
