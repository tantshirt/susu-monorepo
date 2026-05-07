use anchor_lang::prelude::*;

#[error_code]
pub enum SusuError {
    #[msg("The group has reached its maximum member count.")]
    GroupFull,
    #[msg("The group has already started and no longer accepts lifecycle changes.")]
    GroupAlreadyStarted,
    #[msg("The signer is not invited to this group.")]
    MemberNotInvited,
    #[msg("The requested member count is outside the supported range.")]
    InvalidMemberCount,
    #[msg("The supplied mint is not supported by this group.")]
    MintNotSupported,
    #[msg("The group has been cancelled.")]
    GroupCancelled,
    #[msg("This member has already accepted the invite.")]
    AlreadyAccepted,
    #[msg("Curve arithmetic overflowed; reduce contribution or parameters.")]
    CurveOverflow,
    #[msg("Curve inputs are out of range (n must be 3..=12, slot < n).")]
    InvalidCurveParams,
    #[msg("The group is not active; contributions are not accepted.")]
    GroupNotActive,
    #[msg("The current time is outside this rotation's contribution window.")]
    OutsideContributionWindow,
    #[msg("The contribution amount must match the group's scheduled contribution.")]
    ContributionAmountMismatch,
    #[msg("Slashed members cannot contribute.")]
    MemberSlashedCannotContribute,
    #[msg("A contribution was already recorded for this rotation.")]
    ContributionAlreadyRecorded,
    #[msg("The rotation index is invalid for this group.")]
    InvalidContributionRotation,
}
