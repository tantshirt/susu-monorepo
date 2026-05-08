//! Account type exports and decoders.

use anchor_lang::AccountDeserialize;

pub use susu::state::{
    ContributionRecord, CurveParams, Group, GroupStatus, MemberPosition, MemberSlot,
    RotationReceipt, SlashStatus,
};

use crate::errors::SusuError;

fn decode_anchor_account<T: AccountDeserialize>(
    account_name: &'static str,
    data: &[u8],
) -> Result<T, SusuError> {
    let mut body = data;
    T::try_deserialize(&mut body).map_err(|source| SusuError::Decode {
        account: account_name,
        details: source.to_string(),
    })
}

pub fn decode_group(data: &[u8]) -> Result<Group, SusuError> {
    decode_anchor_account("Group", data)
}

pub fn decode_member_position(data: &[u8]) -> Result<MemberPosition, SusuError> {
    decode_anchor_account("MemberPosition", data)
}

pub fn decode_rotation_receipt(data: &[u8]) -> Result<RotationReceipt, SusuError> {
    decode_anchor_account("RotationReceipt", data)
}
