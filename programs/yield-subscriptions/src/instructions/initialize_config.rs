use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::SEEDS_CONFIG;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [SEEDS_CONFIG],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_config(
    ctx: Context<InitializeConfig>,
    admin: Pubkey,
    annual_yield_bps: u16,
    protocol_fee_bps: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.global_config;
    config.admin = admin;
    config.annual_yield_bps = annual_yield_bps;
    config.protocol_fee_bps = protocol_fee_bps;
    config.bump = ctx.bumps.global_config;
    Ok(())
}
