use anchor_lang::prelude::{pubkey, Pubkey};

pub const USDC_DEVNET: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
pub const USDC_MAINNET: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDT_DEVNET: Pubkey = pubkey!("EiXDnrAg9ea2Q6vEPV7E5TpTU1vh41jcuZqKjU5Dc4ZF");
pub const USDT_MAINNET: Pubkey = pubkey!("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

pub fn is_supported_mint(mint: &Pubkey) -> bool {
    mint == &USDC_DEVNET || mint == &USDC_MAINNET || mint == &USDT_DEVNET || mint == &USDT_MAINNET
}
