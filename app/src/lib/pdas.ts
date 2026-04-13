import { PublicKey } from "@solana/web3.js";

const encoder = new TextEncoder();

export const SEED_CONFIG = "config";
export const SEED_PLAN = "plan";
export const SEED_SUB = "sub";
export const SEED_VAULT = "vault";

export function getGlobalConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([encoder.encode(SEED_CONFIG)], programId)[0];
}

export function getMerchantPlanPda(programId: PublicKey, merchant: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([encoder.encode(SEED_PLAN), merchant.toBytes()], programId)[0];
}

export function getVaultPda(programId: PublicKey, merchantPlan: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([encoder.encode(SEED_VAULT), merchantPlan.toBytes()], programId)[0];
}

export function getUserSubscriptionPda(programId: PublicKey, merchantPlan: PublicKey, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [encoder.encode(SEED_SUB), merchantPlan.toBytes(), user.toBytes()],
    programId
  )[0];
}
