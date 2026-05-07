use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Contribute {}

pub fn handler(
    _ctx: Context<Contribute>,
    _group_id: u64,
    _amount: u64,
    _rotation_index: u8,
) -> Result<()> {
    Ok(())
}
