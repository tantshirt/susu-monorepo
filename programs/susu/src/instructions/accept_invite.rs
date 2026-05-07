use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AcceptInvite {}

pub fn handler(_ctx: Context<AcceptInvite>, _group_id: u64) -> Result<()> {
    Ok(())
}
