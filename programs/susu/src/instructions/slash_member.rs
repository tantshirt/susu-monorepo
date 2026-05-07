use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SlashMember {}

pub fn handler(
    _ctx: Context<SlashMember>,
    _group_id: u64,
    _member: Pubkey,
    _penalty_amount: u64,
) -> Result<()> {
    Ok(())
}
