# Vaulter Architecture & Protocol Documentation

This document provides a deep dive into the underlying architecture, program state logic, and integration methods of the Vaulter on-chain protocol on Solana.

---

## 1. Core Mechanics

Vaulter turns a **capital expense (subscription)** into a **capital investment (yield)**. 
Instead of users streaming funds or locking tokens into escrow to be slowly depleted, they lock a core deposit (Principal). The Vaulter protocol manages this deposit, delegates it to external DeFi yield engines (like Kamino Finance), and uses the generated yield to natively settle the merchant's recurring cost.

### Key Tenets
1. **Principal Protection**: A user's principal is never depleted to pay the merchant. It is mathematically segregated.
2. **Permissionless Settlement**: The `settle` instruction can be executed by anyone (crank/keeper).
3. **Deterministic State**: 100% PDA (Program Derived Address) architecture. No external admin keys can touch vault funds.

---

## 2. On-Chain State Management

Vaulter uses Solana's Anchor framework to define strict account schemas.

> [!NOTE] 
> All accounts are derived natively using constant seeds. Because of this, the frontend never tracks user IDs—it independently calculates states based on wallet keys and the hardcoded program ID (`8akGGuXaq6fRkDfxVRVoTEZsW4w55BPzeuardrFxjLAH`).

### 2.1. Global Config (`GlobalConfig`)
**Seed**: `b"config"`
A singleton PDA initialized by the protocol admin.
* **Fields**:
  * `admin`: Authority capable of pausing or adjusting protocol parameters.
  * `annual_yield_bps`: Target yield expectation (e.g., 1000 = 10% APY).
  * `protocol_fee_bps`: Protocol tax assessed on successful merchant settlements.

### 2.2. Merchant Plan (`MerchantPlan`)
**Seed**: `b"plan", merchant_pubkey`
Represents a predefined subscription offering by a specific merchant.
* **Fields**:
  * `merchant`: The creator of the plan and receiver of all yield.
  * `price_per_period`: How much USDC the merchant expects per billing cycle.
  * `billing_period`: Cycle length in seconds (e.g., 2592000 for 30 days).
  * `min_deposit_amount`: The mandated threshold the user must lock to participate.
  * `active_subs`: Tally for analytics and TVL calculation.

### 2.3. User Subscription (`UserSubscription`)
**Seed**: `b"sub", merchant_plan_pubkey, user_pubkey`
The relationship linking a user's wallet to a specific Merchant Plan.
* **Fields**:
  * `user`: The wallet that owns the principal.
  * `merchant_plan`: The plan signed up for.
  * `deposit_amount`: Exact active balance locked.
  * `last_settled_at`: Unix timestamp of the last billing/yield capture.

---

## 3. The Kamino Finance Integration (The Yield Engine)

Vaulter doesn't hold the funds statically. Through Cross-Program Invocations (CPI), the Vault deposits incoming USDC into **Kamino Finance Lending Pools**.

### How it works:
1. User deposits 1000 USDC.
2. Vaulter takes the USDC, sends it to the Kamino Vault via CPI `kamino_deposit`.
3. Vaulter receives `kUSDC` (Kamino yield-bearing LP tokens) into the PDA. 
4. The Vault's value inherently grows compared to the anchored principal.
 
> [!IMPORTANT]
> The Vaulter protocol is fundamentally agnostic. While heavily optimized for Kamino, the internal trait system allows integrating Solend, Marginfi, or standard Jito SOL staking derivatives in future versions.

---

## 4. The Settle Mechanism

The heart of Vaulter is the `settle` instruction. Because Solana lacks native cron jobs, settlements must be triggered.

1. **Trigger Phase**: A keeper (or the merchant themselves) fires `settle` on a specific `UserSubscription`.
2. **Time Validation**: The smart contract verifies that `current_time >= last_settled_at + billing_period`.
3. **Yield Realization**: The contract withdraws enough `kUSDC` from Kamino to cover the `price_per_period`.
4. **Distribution**: 
   * `Protocol Fee` is routed to the `GlobalConfig` admin treasury.
   * `Remainder` is routed to the `Merchant` token account.
5. **State Update**: `last_settled_at` is updated. 

> [!TIP]
> If a user cancels their subscription early or the yield does not cover the period (market downturn), the user's principal is fully refunded up to the pro-rata unhandled period, guaranteeing mathematical solvency.

---

## 5. Security & Risk

* **No Admin Withdrawals**: The protocol owner has no instruction to `withdraw` from the `Vault` PDA.
* **Anchor Constraints**: Every instruction employs specific `ConstraintSeeds` restricting cross-contamination (e.g., passing a User Account against the wrong Merchant Account).
* **Smart Contract Risk**: Vaulter absorbs Kamino's smart contract risk. If Kamino's vaults are exploited, the localized `kUSDC` tokens inside the Vaulter PDA would lose value, impacting the locked principal.
