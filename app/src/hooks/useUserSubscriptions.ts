import { useCallback, useEffect, useState } from "react";
import type { Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import type { ProgramAccount, UserSubscriptionAccount } from "../types/accounts";
import type { YieldSubscriptions } from "../lib/program";
import { getErrorMessage } from "../lib/errors";

interface UseUserSubscriptionsResult {
  subscriptions: ProgramAccount<UserSubscriptionAccount>[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserSubscriptions(
  program: Program<YieldSubscriptions> | null,
  userPubkey: PublicKey | null
): UseUserSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<ProgramAccount<UserSubscriptionAccount>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !userPubkey) {
      setSubscriptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userFilter = [{ memcmp: { offset: 0, bytes: userPubkey.toBase58() } }];
      const accounts = (await (program.account as any).userSubscription.all(userFilter)) as ProgramAccount<UserSubscriptionAccount>[];
      setSubscriptions(accounts);
      setError(null);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [program, userPubkey]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!program || !userPubkey) {
      return;
    }

    let active = true;
    let listenerId: number | null = null;
    const connection = program.provider.connection;

    (async () => {
      listenerId = await connection.onProgramAccountChange(program.programId, () => {
        if (active) {
          void refetch();
        }
      });
    })();

    return () => {
      active = false;
      if (listenerId !== null) {
        void connection.removeProgramAccountChangeListener(listenerId);
      }
    };
  }, [program, userPubkey, refetch]);

  return { subscriptions, loading, error, refetch };
}
