//! Ergonomic Rust client and transaction builders.

use anchor_lang::prelude::Pubkey;
use anchor_lang::solana_program::instruction::Instruction;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::Signature;
use solana_signer::signers::Signers;
use solana_transaction::Transaction;

use crate::errors::SusuError;
use crate::instructions::{
    self, AcceptInviteAccounts, CancelGroupAccounts, ClaimPayoutAccounts, ClaimPayoutArgs,
    ContributeAccounts, ContributeArgs, CreateGroupAccounts, CreateGroupArgs,
    PostCollateralAccounts, PostCollateralArgs, TopUpCollateralAccounts, TopUpCollateralArgs,
    WithdrawCollateralAccounts, WithdrawCollateralArgs,
};
use crate::queries::{self, ParticipationRecord};
use crate::{Group, MemberPosition};

pub const DEFAULT_SUSU_PROGRAM_ID: Pubkey = susu::ID;
pub const DEFAULT_COMPUTE_UNITS: u32 = 200_000;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum Cluster {
    Localnet,
    Devnet,
    Testnet,
    MainnetBeta,
}

impl Cluster {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Localnet => "localnet",
            Self::Devnet => "devnet",
            Self::Testnet => "testnet",
            Self::MainnetBeta => "mainnet-beta",
        }
    }
}

pub struct SusuClient {
    pub cluster: Cluster,
    pub rpc: RpcClient,
    pub program_id: Pubkey,
    pub compute_units: u32,
}

impl core::fmt::Debug for SusuClient {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_struct("SusuClient")
            .field("cluster", &self.cluster)
            .field("program_id", &self.program_id)
            .field("compute_units", &self.compute_units)
            .finish_non_exhaustive()
    }
}

impl SusuClient {
    pub fn new(cluster: Cluster, rpc: RpcClient) -> Self {
        Self {
            cluster,
            rpc,
            program_id: DEFAULT_SUSU_PROGRAM_ID,
            compute_units: DEFAULT_COMPUTE_UNITS,
        }
    }

    pub fn with_program_id(mut self, program_id: Pubkey) -> Self {
        self.program_id = program_id;
        self
    }

    pub fn with_compute_units(mut self, compute_units: u32) -> Self {
        self.compute_units = compute_units;
        self
    }

    pub fn create_group(
        &self,
        accounts: CreateGroupAccounts,
        args: CreateGroupArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::create_group(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn accept_invite(&self, accounts: AcceptInviteAccounts) -> TransactionBuilder<'_> {
        self.transaction(vec![
            instructions::accept_invite(self.program_id, accounts).into_instruction()
        ])
    }

    pub fn post_collateral(
        &self,
        accounts: PostCollateralAccounts,
        args: PostCollateralArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::post_collateral(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn contribute(
        &self,
        accounts: ContributeAccounts,
        args: ContributeArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::contribute(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn claim_payout(
        &self,
        accounts: ClaimPayoutAccounts,
        args: ClaimPayoutArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::claim_payout(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn top_up_collateral(
        &self,
        accounts: TopUpCollateralAccounts,
        args: TopUpCollateralArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::top_up_collateral(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn withdraw_collateral(
        &self,
        accounts: WithdrawCollateralAccounts,
        args: WithdrawCollateralArgs,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::withdraw_collateral(
            self.program_id,
            accounts,
            args,
        )
        .into_instruction()])
    }

    pub fn cancel_group(
        &self,
        accounts: CancelGroupAccounts,
        group_id: u64,
    ) -> TransactionBuilder<'_> {
        self.transaction(vec![instructions::cancel_group(
            self.program_id,
            accounts,
            group_id,
        )
        .into_instruction()])
    }

    pub async fn get_group(&self, group: &Pubkey) -> Result<Option<Group>, SusuError> {
        Ok(queries::get_group(&self.rpc, group).await?)
    }

    pub async fn get_member_position(
        &self,
        group: &Pubkey,
        member: &Pubkey,
    ) -> Result<Option<MemberPosition>, SusuError> {
        Ok(queries::get_member_position(&self.rpc, &self.program_id, group, member).await?)
    }

    pub async fn query_history(
        &self,
        wallet: &Pubkey,
    ) -> Result<Vec<ParticipationRecord>, SusuError> {
        Ok(queries::query_participation_history(&self.rpc, &self.program_id, wallet).await?)
    }

    fn transaction(&self, instructions: Vec<Instruction>) -> TransactionBuilder<'_> {
        TransactionBuilder {
            client: self,
            instructions,
            simulate: true,
        }
    }
}

#[derive(Debug)]
pub struct TransactionBuilder<'client> {
    client: &'client SusuClient,
    instructions: Vec<Instruction>,
    simulate: bool,
}

impl<'client> TransactionBuilder<'client> {
    pub fn with_simulate(mut self, simulate: bool) -> Self {
        self.simulate = simulate;
        self
    }

    pub fn instructions(&self) -> &[Instruction] {
        &self.instructions
    }

    pub fn send<T: Signers + ?Sized>(self, signers: &T) -> Result<Signature, SusuError> {
        let signer_pubkeys = signers.try_pubkeys()?;
        let payer = signer_pubkeys
            .first()
            .ok_or_else(|| SusuError::Config("at least one signer is required".to_string()))?;
        let recent_blockhash = self.client.rpc.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(
            &self.instructions,
            Some(payer),
            signers,
            recent_blockhash,
        );

        if self.simulate {
            let response = self.client.rpc.simulate_transaction(&tx)?;
            if response.value.err.is_some() {
                return Err(SusuError::Simulation {
                    logs: response.value.logs.unwrap_or_default(),
                });
            }
        }

        Ok(self.client.rpc.send_and_confirm_transaction(&tx)?)
    }
}
