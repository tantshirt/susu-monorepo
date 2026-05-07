use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimPayout {}

pub fn handler(
    _ctx: Context<ClaimPayout>,
    _group_id: u64,
    _rotation_index: u8,
) -> Result<()> {
    Ok(())
}
