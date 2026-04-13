import { useCallback, useEffect, useState } from "react";
import type { Program } from "@coral-xyz/anchor";
import type { MerchantPlanAccount, ProgramAccount } from "../types/accounts";
import type { YieldSubscriptions } from "../lib/program";
import { getErrorMessage } from "../lib/errors";

interface UseMerchantPlansResult {
  plans: ProgramAccount<MerchantPlanAccount>[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMerchantPlans(program: Program<YieldSubscriptions> | null): UseMerchantPlansResult {
  const [plans, setPlans] = useState<ProgramAccount<MerchantPlanAccount>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program) {
      setPlans([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const accounts = (await (program.account as any).merchantPlan.all()) as ProgramAccount<MerchantPlanAccount>[];
      setPlans(accounts);
      setError(null);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!program) {
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
  }, [program, refetch]);

  return { plans, loading, error, refetch };
}
