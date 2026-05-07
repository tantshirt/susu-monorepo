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
}
