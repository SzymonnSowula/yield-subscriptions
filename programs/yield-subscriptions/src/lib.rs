use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod constants;
pub mod errors;
pub mod events;

use instructions::*;

declare_id!("8akGGuXaq6fRkDfxVRVoTEZsW4w55BPzeuardrFxjLAH");

#[program]
pub mod yield_subscriptions {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin: Pubkey,
        annual_yield_bps: u16,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        handle_initialize_config(ctx, admin, annual_yield_bps, protocol_fee_bps)
    }

    pub fn create_plan(
        ctx: Context<CreatePlan>,
        price_per_period: u64,
        period_seconds: i64,
        min_deposit: u64,
    ) -> Result<()> {
        handle_create_plan(ctx, price_per_period, period_seconds, min_deposit)
    }

    pub fn subscribe(ctx: Context<Subscribe>, initial_deposit: u64) -> Result<()> {
        handle_subscribe(ctx, initial_deposit)
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        handle_settle(ctx)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        handle_cancel(ctx)
    }
}
