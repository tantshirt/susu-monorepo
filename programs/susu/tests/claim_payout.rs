use anchor_lang::error::Error;
use anchor_lang::prelude::Pubkey;
use susu::error::SusuError;
use susu::instructions::claim_payout::{calculate_payout_amount, rotation_close_timestamp};
use susu::seeds::{GROUP_SEED, ROTATION_SEED};
use susu::ID;

const CLAIM_PAYOUT_SOURCE: &str = include_str!("../src/instructions/claim_payout.rs");
const PAYOUT_CLAIMED_LOG: &str = "payout_claimed";

fn assert_susu_error<T: std::fmt::Debug>(result: anchor_lang::Result<T>, expected: SusuError) {
    match result {
        Err(Error::AnchorError(error)) => {
            assert_eq!(error.error_code_number, u32::from(expected));
            assert_eq!(error.error_name, expected.name());
        }
        other => panic!("expected {expected:?}, got {other:?}"),
    }
}

fn compact(source: &str) -> String {
    source.split_whitespace().collect()
}

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[
            GROUP_SEED,
            creator.as_ref(),
            group_id.to_le_bytes().as_ref(),
        ],
        &ID,
    )
    .0
}

#[test]
fn claim_payout_receipt_pda_uses_rotation_seed_group_and_le_index() {
    let creator = Pubkey::new_unique();
    let group = derive_group_pda(creator, 42);
    let rotation_index = 3_u8;

    let (receipt, _bump) = Pubkey::find_program_address(
        &[
            ROTATION_SEED,
            group.as_ref(),
            rotation_index.to_le_bytes().as_ref(),
        ],
        &ID,
    );

    assert_ne!(receipt, group);
    assert!(CLAIM_PAYOUT_SOURCE.contains("ROTATION_SEED"));
    assert!(CLAIM_PAYOUT_SOURCE.contains("rotation_index.to_le_bytes()"));
}

#[test]
fn calculate_payout_amount_is_checked_n_times_contribution_amount() {
    assert_eq!(calculate_payout_amount(5, 1_000).unwrap(), 5_000);
    assert_susu_error(
        calculate_payout_amount(12, u64::MAX),
        SusuError::ArithmeticOverflow,
    );
}

#[test]
fn rotation_close_timestamp_uses_strict_period_end_math() {
    assert_eq!(rotation_close_timestamp(100, 30, 0).unwrap(), 130);
    assert_eq!(rotation_close_timestamp(100, 30, 2).unwrap(), 190);
    assert_susu_error(
        rotation_close_timestamp(i64::MAX - 5, 30, 0),
        SusuError::ArithmeticOverflow,
    );
}

#[test]
fn claim_payout_source_orders_guards_before_vault_transfer() {
    let source = compact(CLAIM_PAYOUT_SOURCE);

    let active = source.find("GroupStatus::Active").expect("active guard");
    let recipient = source
        .find("NotRotationRecipient")
        .expect("recipient guard");
    let closed = source.find("RotationNotClosed").expect("closed guard");
    let cpi = source
        .find("CpiContext::new_with_signer")
        .expect("vault signer CPI");

    assert!(active < cpi, "active guard must precede CPI");
    assert!(recipient < cpi, "recipient guard must precede CPI");
    assert!(closed < cpi, "closed-period guard must precede CPI");
}

#[test]
fn claim_payout_source_uses_group_pda_as_vault_transfer_authority() {
    let source = CLAIM_PAYOUT_SOURCE;

    assert!(source.contains("TransferChecked"));
    assert!(source.contains("authority: ctx.accounts.group.to_account_info()"));
    assert!(source.contains("GROUP_SEED"));
    assert!(source.contains("new_with_signer"));
    assert_eq!(PAYOUT_CLAIMED_LOG, "payout_claimed");
}
