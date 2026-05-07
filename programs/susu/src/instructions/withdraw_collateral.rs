use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct WithdrawCollateral {}

pub fn handler(
    _ctx: Context<WithdrawCollateral>,
    _group_id: u64,
    _amount: u64,
) -> Result<()> {
    Ok(())
}
