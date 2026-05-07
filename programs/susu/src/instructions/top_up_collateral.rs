use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TopUpCollateral {}

pub fn handler(
    _ctx: Context<TopUpCollateral>,
    _group_id: u64,
    _amount: u64,
) -> Result<()> {
    Ok(())
}
