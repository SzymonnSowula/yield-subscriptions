use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub annual_yield_bps: u16,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct MerchantPlan {
    pub merchant: Pubkey,
    pub token_mint: Pubkey,
    pub price_per_period: u64,
    pub period_seconds: i64,
    pub min_deposit: u64,
    pub vault: Pubkey,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserSubscription {
    pub user: Pubkey,
    pub plan: Pubkey,
    pub principal_deposit: u64,
    pub principal_remaining: u64,
    pub last_settlement_timestamp: i64,
    pub status: u8, // SubscriptionStatus
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SubscriptionStatus {
    Active = 0,
    Canceled = 1,
}
