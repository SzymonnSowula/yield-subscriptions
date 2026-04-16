import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { useMemo } from "react";
import { YIELD_SUBSCRIPTIONS_IDL, type YieldSubscriptions } from "../lib/program";

export function useAnchorProgram(
  connection: Connection,
  wallet: AnchorWallet | undefined
): Program<YieldSubscriptions> | null {
  return useMemo(() => {
    if (!wallet) {
      return null;
    }

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
      commitment: "confirmed"
    });
    return new Program<YieldSubscriptions>(YIELD_SUBSCRIPTIONS_IDL, provider);
  }, [connection, wallet]);
}
