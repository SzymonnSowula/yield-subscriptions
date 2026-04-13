use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Initial deposit is less than the minimum required.")]
    InsufficientDeposit,
    #[msg("Subscription is already canceled.")]
    SubscriptionCanceled,
    #[msg("Nothing to settle yet.")]
    NothingToSettle,
    #[msg("Arithmetic overflow or underflow.")]
    ArithmeticError,
    #[msg("Unauthorized.")]
    Unauthorized,
}
