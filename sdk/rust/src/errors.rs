//! Typed Rust SDK errors.

use solana_client::client_error::ClientError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SusuError {
    #[error(transparent)]
    Program(SusuProgramError),
    #[error("Susu transaction simulation failed")]
    Simulation { logs: Vec<String> },
    #[error("Susu RPC error: {0}")]
    Rpc(ClientError),
    #[error("Susu client cluster mismatch: expected {expected}, actual {actual}")]
    Cluster {
        expected: &'static str,
        actual: String,
        endpoint: Option<String>,
    },
    #[error("Susu account decode failed for {account}: {details}")]
    Decode {
        account: &'static str,
        details: String,
    },
    #[error("Susu signing error: {0}")]
    Signing(String),
    #[error("Susu client configuration error: {0}")]
    Config(String),
}

impl From<solana_client::client_error::ClientError> for SusuError {
    fn from(error: solana_client::client_error::ClientError) -> Self {
        Self::Rpc(error)
    }
}

impl From<solana_signer::SignerError> for SusuError {
    fn from(error: solana_signer::SignerError) -> Self {
        Self::Signing(error.to_string())
    }
}

#[derive(Debug, Clone, Copy, Error, Eq, PartialEq)]
pub enum SusuProgramError {
    #[error("The group has reached its maximum member count.")]
    GroupFull,
    #[error("The group has already started and no longer accepts lifecycle changes.")]
    GroupAlreadyStarted,
    #[error("The signer is not invited to this group.")]
    MemberNotInvited,
    #[error("The requested member count is outside the supported range.")]
    InvalidMemberCount,
    #[error("The supplied mint is not supported by this group.")]
    MintNotSupported,
    #[error("The group has been cancelled.")]
    GroupCancelled,
    #[error("This member has already accepted the invite.")]
    AlreadyAccepted,
    #[error("Curve arithmetic overflowed; reduce contribution or parameters.")]
    CurveOverflow,
    #[error("Curve inputs are out of range (n must be 3..=12, slot < n).")]
    InvalidCurveParams,
    #[error("The group is not active; contributions are not accepted.")]
    GroupNotActive,
    #[error("The current time is outside this rotation's contribution window.")]
    OutsideContributionWindow,
    #[error("The contribution amount must match the group's scheduled contribution.")]
    ContributionAmountMismatch,
    #[error("Slashed members cannot contribute.")]
    MemberSlashedCannotContribute,
    #[error("A contribution was already recorded for this rotation.")]
    ContributionAlreadyRecorded,
    #[error("The rotation index is invalid for this group.")]
    InvalidContributionRotation,
    #[error("The group_id argument does not match this group account.")]
    GroupIdMismatch,
    #[error("Member position state does not match the group and signer.")]
    MemberPositionMismatch,
    #[error("Posted collateral plus top-up is below the curve-required minimum.")]
    InsufficientCollateral,
    #[error("Cannot withdraw collateral until the group is completed or cancelled.")]
    GroupNotCompleted,
    #[error("Collateral already withdrawn.")]
    CollateralAlreadyWithdrawn,
    #[error("Collateral was forfeited due to slash; withdrawal is denied.")]
    CollateralForfeited,
    #[error("Cannot slash yet; grace window after deadline has not ended.")]
    WithinGracePeriod,
    #[error("This member has already been slashed.")]
    AlreadySlashed,
    #[error("Member contributed for this rotation; slash is only for misses.")]
    CannotSlashContributor,
    #[error("Not all accepted members posted required collateral yet.")]
    NotAllCollateralized,
    #[error("Invalid group lifecycle transition.")]
    InvalidStatusTransition,
    #[error("Provided member positions do not match ordered roster.")]
    InvalidMemberPositionList,
    #[error("Arithmetic overflow while calculating payout state.")]
    ArithmeticOverflow,
    #[error("The signer is not the recipient for this rotation.")]
    NotRotationRecipient,
    #[error("This rotation's contribution period has not closed yet.")]
    RotationNotClosed,
    #[error("Rotation has already been claimed.")]
    AlreadyClaimed,
    #[error("This rotation's contribution period is still open.")]
    ContributionPeriodOpen,
}

impl SusuProgramError {
    pub const ANCHOR_ERROR_BASE: u32 = 6000;

    pub fn code(self) -> u32 {
        Self::ANCHOR_ERROR_BASE
            + match self {
                Self::GroupFull => 0,
                Self::GroupAlreadyStarted => 1,
                Self::MemberNotInvited => 2,
                Self::InvalidMemberCount => 3,
                Self::MintNotSupported => 4,
                Self::GroupCancelled => 5,
                Self::AlreadyAccepted => 6,
                Self::CurveOverflow => 7,
                Self::InvalidCurveParams => 8,
                Self::GroupNotActive => 9,
                Self::OutsideContributionWindow => 10,
                Self::ContributionAmountMismatch => 11,
                Self::MemberSlashedCannotContribute => 12,
                Self::ContributionAlreadyRecorded => 13,
                Self::InvalidContributionRotation => 14,
                Self::GroupIdMismatch => 15,
                Self::MemberPositionMismatch => 16,
                Self::InsufficientCollateral => 17,
                Self::GroupNotCompleted => 18,
                Self::CollateralAlreadyWithdrawn => 19,
                Self::CollateralForfeited => 20,
                Self::WithinGracePeriod => 21,
                Self::AlreadySlashed => 22,
                Self::CannotSlashContributor => 23,
                Self::NotAllCollateralized => 24,
                Self::InvalidStatusTransition => 25,
                Self::InvalidMemberPositionList => 26,
                Self::ArithmeticOverflow => 27,
                Self::NotRotationRecipient => 28,
                Self::RotationNotClosed => 29,
                Self::AlreadyClaimed => 30,
                Self::ContributionPeriodOpen => 31,
            }
    }

    pub fn name(self) -> &'static str {
        match self {
            Self::GroupFull => "GroupFull",
            Self::GroupAlreadyStarted => "GroupAlreadyStarted",
            Self::MemberNotInvited => "MemberNotInvited",
            Self::InvalidMemberCount => "InvalidMemberCount",
            Self::MintNotSupported => "MintNotSupported",
            Self::GroupCancelled => "GroupCancelled",
            Self::AlreadyAccepted => "AlreadyAccepted",
            Self::CurveOverflow => "CurveOverflow",
            Self::InvalidCurveParams => "InvalidCurveParams",
            Self::GroupNotActive => "GroupNotActive",
            Self::OutsideContributionWindow => "OutsideContributionWindow",
            Self::ContributionAmountMismatch => "ContributionAmountMismatch",
            Self::MemberSlashedCannotContribute => "MemberSlashedCannotContribute",
            Self::ContributionAlreadyRecorded => "ContributionAlreadyRecorded",
            Self::InvalidContributionRotation => "InvalidContributionRotation",
            Self::GroupIdMismatch => "GroupIdMismatch",
            Self::MemberPositionMismatch => "MemberPositionMismatch",
            Self::InsufficientCollateral => "InsufficientCollateral",
            Self::GroupNotCompleted => "GroupNotCompleted",
            Self::CollateralAlreadyWithdrawn => "CollateralAlreadyWithdrawn",
            Self::CollateralForfeited => "CollateralForfeited",
            Self::WithinGracePeriod => "WithinGracePeriod",
            Self::AlreadySlashed => "AlreadySlashed",
            Self::CannotSlashContributor => "CannotSlashContributor",
            Self::NotAllCollateralized => "NotAllCollateralized",
            Self::InvalidStatusTransition => "InvalidStatusTransition",
            Self::InvalidMemberPositionList => "InvalidMemberPositionList",
            Self::ArithmeticOverflow => "ArithmeticOverflow",
            Self::NotRotationRecipient => "NotRotationRecipient",
            Self::RotationNotClosed => "RotationNotClosed",
            Self::AlreadyClaimed => "AlreadyClaimed",
            Self::ContributionPeriodOpen => "ContributionPeriodOpen",
        }
    }

    pub fn from_code(code: u32) -> Option<Self> {
        Some(match code.checked_sub(Self::ANCHOR_ERROR_BASE)? {
            0 => Self::GroupFull,
            1 => Self::GroupAlreadyStarted,
            2 => Self::MemberNotInvited,
            3 => Self::InvalidMemberCount,
            4 => Self::MintNotSupported,
            5 => Self::GroupCancelled,
            6 => Self::AlreadyAccepted,
            7 => Self::CurveOverflow,
            8 => Self::InvalidCurveParams,
            9 => Self::GroupNotActive,
            10 => Self::OutsideContributionWindow,
            11 => Self::ContributionAmountMismatch,
            12 => Self::MemberSlashedCannotContribute,
            13 => Self::ContributionAlreadyRecorded,
            14 => Self::InvalidContributionRotation,
            15 => Self::GroupIdMismatch,
            16 => Self::MemberPositionMismatch,
            17 => Self::InsufficientCollateral,
            18 => Self::GroupNotCompleted,
            19 => Self::CollateralAlreadyWithdrawn,
            20 => Self::CollateralForfeited,
            21 => Self::WithinGracePeriod,
            22 => Self::AlreadySlashed,
            23 => Self::CannotSlashContributor,
            24 => Self::NotAllCollateralized,
            25 => Self::InvalidStatusTransition,
            26 => Self::InvalidMemberPositionList,
            27 => Self::ArithmeticOverflow,
            28 => Self::NotRotationRecipient,
            29 => Self::RotationNotClosed,
            30 => Self::AlreadyClaimed,
            31 => Self::ContributionPeriodOpen,
            _ => return None,
        })
    }
}

impl From<SusuProgramError> for SusuError {
    fn from(error: SusuProgramError) -> Self {
        Self::Program(error)
    }
}
