use anchor_lang::prelude::*;

#[constant]
pub const SEEDS_CONFIG: &[u8] = b"config";
#[constant]
pub const SEEDS_PLAN: &[u8] = b"plan";
#[constant]
pub const SEEDS_SUB: &[u8] = b"sub";
#[constant]
pub const SEEDS_VAULT: &[u8] = b"vault";

pub const SECONDS_PER_YEAR: i64 = 31_536_000;
