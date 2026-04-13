use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FZsK8dcZbeGEsm4fw45LWssEgYkTkxEPQ5YoMtWdhS61");

#[program]
pub mod yield_subscriptions {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin: Pubkey,
        annual_yield_bps: u16,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, admin, annual_yield_bps, protocol_fee_bps)
    }

    pub fn create_plan(
        ctx: Context<CreatePlan>,
        price_per_period: u64,
        period_seconds: i64,
        min_deposit: u64,
    ) -> Result<()> {
        instructions::create_plan::handler(ctx, price_per_period, period_seconds, min_deposit)
    }

    pub fn subscribe(ctx: Context<Subscribe>, initial_deposit: u64) -> Result<()> {
        instructions::subscribe::handler(ctx, initial_deposit)
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        instructions::settle::handler(ctx)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        instructions::cancel::handler(ctx)
    }
}
