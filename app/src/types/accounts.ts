import { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

export interface MerchantPlanAccount {
  merchant: PublicKey;
  tokenMint: PublicKey;
  pricePerPeriod: BN;
  periodSeconds: BN;
  minDeposit: BN;
  vault: PublicKey;
  bump: number;
  vaultBump: number;
}

export interface UserSubscriptionAccount {
  user: PublicKey;
  plan: PublicKey;
  principalDeposit: BN;
  principalRemaining: BN;
  lastSettlementTimestamp: BN;
  status: number;
  bump: number;
}

export interface ProgramAccount<T> {
  publicKey: PublicKey;
  account: T;
}
