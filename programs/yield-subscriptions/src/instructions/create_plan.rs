use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;
use crate::constants::{SEEDS_PLAN, SEEDS_VAULT};
use crate::events::PlanCreated;

#[derive(Accounts)]
pub struct CreatePlan<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        init,
        payer = merchant,
        space = 8 + MerchantPlan::INIT_SPACE,
        seeds = [SEEDS_PLAN, merchant.key().as_ref()],
        bump
    )]
    pub merchant_plan: Account<'info, MerchantPlan>,
    #[account(
        init,
        payer = merchant,
        seeds = [SEEDS_VAULT, merchant_plan.key().as_ref()],
        bump,
        token::mint = merchant_token_mint,
        token::authority = merchant_plan,
    )]
    pub vault: Account<'info, TokenAccount>,
    pub merchant_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_create_plan(
    ctx: Context<CreatePlan>,
    price_per_period: u64,
    period_seconds: i64,
    min_deposit: u64,
) -> Result<()> {
    let plan = &mut ctx.accounts.merchant_plan;
    plan.merchant = ctx.accounts.merchant.key();
    plan.token_mint = ctx.accounts.merchant_token_mint.key();
    plan.price_per_period = price_per_period;
    plan.period_seconds = period_seconds;
    plan.min_deposit = min_deposit;
    plan.vault = ctx.accounts.vault.key();
    plan.bump = ctx.bumps.merchant_plan;
    plan.vault_bump = ctx.bumps.vault;

    emit!(PlanCreated {
        merchant: plan.merchant,
        plan: plan.key(),
        price_per_period,
        period_seconds,
    });

    Ok(())
}
