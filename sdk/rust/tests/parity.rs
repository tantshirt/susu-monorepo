use std::str::FromStr;

use anchor_lang::prelude::Pubkey;
use solana_client::rpc_client::RpcClient;
use solana_compute_budget_interface::id as compute_budget_id;
use susu_client::{
    group_pda, member_pda, rotation_history_pda, vault_pda, AcceptInviteAccounts, Cluster,
    SusuClient, DEFAULT_SUSU_PROGRAM_ID,
};

const CREATOR: &str = "11111111111111111111111111111111";
const MEMBER: &str = "So11111111111111111111111111111111111111112";
const GROUP_ID: u64 = 42;
const ROTATION_INDEX: u8 = 7;

const EXPECTED_GROUP_PDA: &str = "BgFLM8vhfSSpAxpKaxczPyucae8F96Jtg2f4ib851Zx9";
const EXPECTED_GROUP_BUMP: u8 = 252;
const EXPECTED_MEMBER_PDA: &str = "DDkjBd4gxjx3ZgtNdL9PNioU8fEZfs2KbFsJipVuE1yw";
const EXPECTED_MEMBER_BUMP: u8 = 248;
const EXPECTED_VAULT_PDA: &str = "KZrFKJUV61JNaARfYEuBVnssVMCcUq6u7XhrkvDKanW";
const EXPECTED_VAULT_BUMP: u8 = 255;
const EXPECTED_ROTATION_HISTORY_PDA: &str = "3Ndd4nj19FWTJjQ1eHmengw5Ec3RbAePHduyZLrN9DxG";
const EXPECTED_ROTATION_HISTORY_BUMP: u8 = 255;

#[test]
fn pda_derivations_match_story_6_4_ts_vector() {
    let creator = Pubkey::from_str(CREATOR).unwrap();
    let member = Pubkey::from_str(MEMBER).unwrap();

    let group = group_pda(&DEFAULT_SUSU_PROGRAM_ID, &creator, GROUP_ID);
    assert_eq!(group.address.to_string(), EXPECTED_GROUP_PDA);
    assert_eq!(group.bump, EXPECTED_GROUP_BUMP);

    let member_position = member_pda(&DEFAULT_SUSU_PROGRAM_ID, &group.address, &member);
    assert_eq!(member_position.address.to_string(), EXPECTED_MEMBER_PDA);
    assert_eq!(member_position.bump, EXPECTED_MEMBER_BUMP);

    let vault = vault_pda(&DEFAULT_SUSU_PROGRAM_ID, &group.address);
    assert_eq!(vault.address.to_string(), EXPECTED_VAULT_PDA);
    assert_eq!(vault.bump, EXPECTED_VAULT_BUMP);

    let rotation = rotation_history_pda(&DEFAULT_SUSU_PROGRAM_ID, &group.address, ROTATION_INDEX);
    assert_eq!(rotation.address.to_string(), EXPECTED_ROTATION_HISTORY_PDA);
    assert_eq!(rotation.bump, EXPECTED_ROTATION_HISTORY_BUMP);
}

#[test]
fn client_applies_configured_compute_unit_limit() {
    let compute_units = 345_678;
    let client = SusuClient::new(Cluster::Localnet, RpcClient::new("http://localhost:8899"))
        .with_compute_units(compute_units);
    let program_ix = client.accept_invite(AcceptInviteAccounts {
        group: Pubkey::new_unique(),
        member_position: Pubkey::new_unique(),
        member: Pubkey::new_unique(),
        system_program: Pubkey::new_unique(),
    });

    let instructions = program_ix.instructions();
    assert_eq!(instructions.len(), 2);
    assert_eq!(instructions[0].program_id, compute_budget_id());
    assert_eq!(instructions[0].accounts, vec![]);
    let mut expected_data = vec![2];
    expected_data.extend_from_slice(&compute_units.to_le_bytes());
    assert_eq!(instructions[0].data, expected_data);
    assert_eq!(instructions[1].program_id, DEFAULT_SUSU_PROGRAM_ID);
}
