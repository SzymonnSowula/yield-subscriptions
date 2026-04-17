use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::{SEEDS_PLAN, SECONDS_PER_YEAR};
use crate::errors::ErrorCode;
use crate::events::Canceled;

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        mut, 
        has_one = plan,
        constraint = user_subscription.status == SubscriptionStatus::Active as u8 @ ErrorCode::SubscriptionCanceled
    )]
    pub user_subscription: Account<'info, UserSubscription>,
    pub plan: Account<'info, MerchantPlan>,
    #[account(mut)]
    pub plan_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_cancel(ctx: Context<Cancel>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let sub = &mut ctx.accounts.user_subscription;
    let plan = &ctx.accounts.plan;
    let config = &ctx.accounts.global_config;

    require_keys_eq!(sub.user, ctx.accounts.user.key(), ErrorCode::Unauthorized);

    // Settle-like logic before cancellation
    let elapsed_seconds = now
        .checked_sub(sub.last_settlement_timestamp)
        .ok_or(ErrorCode::ArithmeticError)?;
    
    let periods_elapsed = elapsed_seconds
        .checked_div(plan.period_seconds)
        .ok_or(ErrorCode::ArithmeticError)?;

    if periods_elapsed > 0 {
        let amount_due = periods_elapsed
            .checked_mul(plan.price_per_period as i64)
            .ok_or(ErrorCode::ArithmeticError)? as u64;

        let yield_generated = (sub.principal_remaining as u128)
            .checked_mul(config.annual_yield_bps as u128)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_mul(elapsed_seconds as u128)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_div(10000)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_div(SECONDS_PER_YEAR as u128)
            .ok_or(ErrorCode::ArithmeticError)? as u64;

        let paid_from_yield = std::cmp::min(yield_generated, amount_due);
        let shortfall = amount_due.checked_sub(paid_from_yield).ok_or(ErrorCode::ArithmeticError)?;

        let mut total_paid = paid_from_yield;

        if shortfall > 0 {
            if sub.principal_remaining < shortfall {
                total_paid = total_paid.checked_add(sub.principal_remaining).ok_or(ErrorCode::ArithmeticError)?;
                sub.principal_remaining = 0;
            } else {
                sub.principal_remaining = sub.principal_remaining.checked_sub(shortfall).ok_or(ErrorCode::ArithmeticError)?;
                total_paid = total_paid.checked_add(shortfall).ok_or(ErrorCode::ArithmeticError)?;
            }
        }

        if total_paid > 0 {
            let seeds = &[
                SEEDS_PLAN,
                plan.merchant.as_ref(),
                &[plan.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.plan_vault.to_account_info(),
                to: ctx.accounts.merchant_token_account.to_account_info(),
                authority: ctx.accounts.plan.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, total_paid)?;
        }
    }

    // Return remaining principal to user
    if sub.principal_remaining > 0 {
        let seeds = &[
            SEEDS_PLAN,
            plan.merchant.as_ref(),
            &[plan.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.plan_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.plan.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, sub.principal_remaining)?;
    }

    sub.principal_remaining = 0;
    sub.status = SubscriptionStatus::Canceled as u8;

    emit!(Canceled {
        user: sub.user,
        plan: sub.plan,
    });

    Ok(())
}
