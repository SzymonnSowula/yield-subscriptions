use anchor_lang::prelude::*;

#[event]
pub struct PlanCreated {
    pub merchant: Pubkey,
    pub plan: Pubkey,
    pub price_per_period: u64,
    pub period_seconds: i64,
}

#[event]
pub struct Subscribed {
    pub user: Pubkey,
    pub plan: Pubkey,
    pub initial_deposit: u64,
}

#[event]
pub struct Settled {
    pub user: Pubkey,
    pub plan: Pubkey,
    pub amount_paid: u64,
    pub yield_used: u64,
    pub principal_used: u64,
    pub remaining_principal: u64,
}

#[event]
pub struct Canceled {
    pub user: Pubkey,
    pub plan: Pubkey,
}
