import type { Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import anchorTomlRaw from "../../../Anchor.toml?raw";
import idlJson from "./idl.json";

const PROGRAM_KEY = "yield_subscriptions";
const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_USDC_MINT = "Yzby4YXXkvhW5Soety1qDvjCMN8vtif1VkuLS5Ygaiq";

function readProgramIdFromSection(rawToml: string, section: string): string | null {
  const sectionMatch = rawToml.match(new RegExp(`\\[programs\\.${section}\\]([\\s\\S]*?)(?=\\n\\[|$)`));

  if (!sectionMatch) {
    return null;
  }

  const keyMatch = sectionMatch[1]?.match(new RegExp(`${PROGRAM_KEY}\\s*=\\s*"([^"]+)"`));
  return keyMatch?.[1] ?? null;
}

function resolveProgramId(): string {
  const envProgramId = import.meta.env.VITE_PROGRAM_ID?.trim();
  if (envProgramId) {
    return envProgramId;
  }

  const devnet = readProgramIdFromSection(anchorTomlRaw, "devnet");
  if (devnet) {
    return devnet;
  }

  const localnet = readProgramIdFromSection(anchorTomlRaw, "localnet");
  if (localnet) {
    return localnet;
  }

  throw new Error(`Program ID for ${PROGRAM_KEY} not found in Anchor.toml`);
}

export type YieldSubscriptions = Idl;

export const YIELD_SUBSCRIPTIONS_IDL = idlJson as YieldSubscriptions;
export const PROGRAM_ID = new PublicKey(resolveProgramId());
export const RPC_URL = import.meta.env.VITE_RPC_URL?.trim() || DEFAULT_RPC_URL;
export const USDC_MINT = new PublicKey(import.meta.env.VITE_USDC_MINT?.trim() || DEFAULT_USDC_MINT);
