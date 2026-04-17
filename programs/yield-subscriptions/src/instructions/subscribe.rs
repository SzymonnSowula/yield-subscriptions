use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::SEEDS_SUB;
use crate::errors::ErrorCode;
use crate::events::Subscribed;

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub merchant_plan: Account<'info, MerchantPlan>,
    #[account(
        init,
        payer = user,
        space = 8 + UserSubscription::INIT_SPACE,
        seeds = [SEEDS_SUB, merchant_plan.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_subscription: Account<'info, UserSubscription>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_subscribe(ctx: Context<Subscribe>, initial_deposit: u64) -> Result<()> {
    require!(
        initial_deposit >= ctx.accounts.merchant_plan.min_deposit,
        ErrorCode::InsufficientDeposit
    );

    // Transfer tokens from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, initial_deposit)?;

    let sub = &mut ctx.accounts.user_subscription;
    sub.user = ctx.accounts.user.key();
    sub.plan = ctx.accounts.merchant_plan.key();
    sub.principal_deposit = initial_deposit;
    sub.principal_remaining = initial_deposit;
    sub.last_settlement_timestamp = Clock::get()?.unix_timestamp;
    sub.status = SubscriptionStatus::Active as u8;
    sub.bump = ctx.bumps.user_subscription;

    emit!(Subscribed {
        user: sub.user,
        plan: sub.plan,
        initial_deposit,
    });

    Ok(())
}
