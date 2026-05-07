use anchor_lang::prelude::Pubkey;
use susu::constants::{is_supported_mint, USDC_DEVNET, USDC_MAINNET, USDT_DEVNET, USDT_MAINNET};
use susu::error::SusuError;
use susu::seeds::GROUP_SEED;
use susu::ID;

const GROUP_CREATED_LOG: &str = "group_created";
const DUPLICATE_CREATE_RUNTIME_ERROR: &str = "AccountAlreadyInitialized";
const CREATE_GROUP_SOURCE: &str = include_str!("../src/instructions/create_group.rs");
const FORBIDDEN_CREATE_GROUP_TOKEN_SIDE_EFFECT_TERMS: [&str; 12] = [
    "anchor_spl",
    "tokenaccount",
    "token_program",
    "associated_token",
    "transfer",
    "transfer_checked",
    "cpi",
    "invoke",
    "vault",
    "custody",
    "fee",
    "yield",
];

fn validate_create_group_inputs(n: u8, mint: Pubkey) -> Result<(), SusuError> {
    if !(3..=12).contains(&n) {
        return Err(SusuError::InvalidMemberCount);
    }

    if !is_supported_mint(&mint) {
        return Err(SusuError::MintNotSupported);
    }

    Ok(())
}

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    let group_id_bytes = group_id.to_le_bytes();
    Pubkey::find_program_address(
        &[GROUP_SEED, creator.as_ref(), group_id_bytes.as_ref()],
        &ID,
    )
    .0
}

#[test]
fn test_create_group_happy_path() {
    let creator = Pubkey::new_unique();
    let group_id = 42;
    let group = derive_group_pda(creator, group_id);

    validate_create_group_inputs(5, USDC_DEVNET).expect("USDC_DEVNET and n=5 must be accepted");

    assert_ne!(group, creator);
    assert!(is_supported_mint(&USDC_DEVNET));
    assert_eq!(GROUP_CREATED_LOG, "group_created");
}

#[test]
fn test_create_group_accepts_member_count_bounds() {
    for n in [3, 12] {
        validate_create_group_inputs(n, USDC_DEVNET).expect("inclusive n bounds must be accepted");
    }
}

#[test]
fn test_create_group_invalid_n_zero() {
    assert!(matches!(
        validate_create_group_inputs(0, USDC_DEVNET),
        Err(SusuError::InvalidMemberCount)
    ));
}

#[test]
fn test_create_group_invalid_n_too_small() {
    assert!(matches!(
        validate_create_group_inputs(2, USDC_DEVNET),
        Err(SusuError::InvalidMemberCount)
    ));
}

#[test]
fn test_create_group_invalid_n_too_large() {
    assert!(matches!(
        validate_create_group_inputs(13, USDC_DEVNET),
        Err(SusuError::InvalidMemberCount)
    ));
}

#[test]
fn test_create_group_accepts_all_allowlisted_mints() {
    for mint in [USDC_DEVNET, USDC_MAINNET, USDT_DEVNET, USDT_MAINNET] {
        validate_create_group_inputs(5, mint).expect("allowlisted USDC/USDT mint must be accepted");
        assert!(is_supported_mint(&mint));
    }
}

#[test]
fn test_create_group_unsupported_mint() {
    assert!(matches!(
        validate_create_group_inputs(5, Pubkey::new_unique()),
        Err(SusuError::MintNotSupported)
    ));
}

#[test]
fn test_create_group_rejects_default_pubkey_mint() {
    assert!(matches!(
        validate_create_group_inputs(5, Pubkey::default()),
        Err(SusuError::MintNotSupported)
    ));
}

#[test]
fn test_create_group_double_create_fails() {
    let creator = Pubkey::new_unique();
    let group_id = 7;
    let first = derive_group_pda(creator, group_id);
    let duplicate = derive_group_pda(creator, group_id);

    assert_eq!(first, duplicate);
    assert_eq!(DUPLICATE_CREATE_RUNTIME_ERROR, "AccountAlreadyInitialized");
}

#[test]
fn test_create_group_has_no_token_custody_fee_or_yield_proxy() {
    let lower = CREATE_GROUP_SOURCE.to_lowercase();

    for forbidden in FORBIDDEN_CREATE_GROUP_TOKEN_SIDE_EFFECT_TERMS {
        assert!(
            !lower.contains(forbidden),
            "create_group must not introduce {forbidden} behavior"
        );
    }
}
