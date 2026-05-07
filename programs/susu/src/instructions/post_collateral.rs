use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct PostCollateral {}

pub fn handler(_ctx: Context<PostCollateral>, _group_id: u64, _amount: u64) -> Result<()> {
    Ok(())
}
