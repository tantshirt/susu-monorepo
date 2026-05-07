use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CancelGroup {}

pub fn handler(_ctx: Context<CancelGroup>, _group_id: u64) -> Result<()> {
    Ok(())
}
