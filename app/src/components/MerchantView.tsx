import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import type { YieldSubscriptions } from "../lib/program";
import { getMerchantPlanPda, getVaultPda } from "../lib/pdas";
import { getErrorMessage } from "../lib/errors";
import { formatUsdc, parseUsdcToBn, periodDaysToSeconds, periodSecondsToDays } from "../lib/usdc";
import type { MerchantPlanAccount, ProgramAccount } from "../types/accounts";

interface MerchantViewProps {
  program: Program<YieldSubscriptions>;
  merchant: PublicKey;
  globalConfigPda: PublicKey;
  usdcMint: PublicKey;
  onTx: (signature: string, label: string) => void;
}

const PERIOD_OPTIONS = [7, 30, 90] as const;

function shortPk(pubkey: PublicKey): string {
  const value = pubkey.toBase58();
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export function MerchantView({ program, merchant, globalConfigPda, usdcMint, onTx }: MerchantViewProps) {
  const [pricePerPeriod, setPricePerPeriod] = useState("1");
  const [periodDays, setPeriodDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [minDeposit, setMinDeposit] = useState("10");

  const [plans, setPlans] = useState<ProgramAccount<MerchantPlanAccount>[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [globalConfigExists, setGlobalConfigExists] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const refreshMerchantPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const filters = [{ memcmp: { offset: 8, bytes: merchant.toBase58() } }];
      const merchantPlans = (await (program.account as any).merchantPlan.all(filters)) as ProgramAccount<MerchantPlanAccount>[];
      setPlans(merchantPlans);
      setError(null);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoadingPlans(false);
    }
  }, [program, merchant]);

  useEffect(() => {
    void refreshMerchantPlans();
  }, [refreshMerchantPlans]);

  useEffect(() => {
    let active = true;

    const checkConfig = async () => {
      try {
        const info = await program.provider.connection.getAccountInfo(globalConfigPda);
        if (active) {
          setGlobalConfigExists(Boolean(info));
        }
      } catch {
        if (active) {
          setGlobalConfigExists(false);
        }
      }
    };

    void checkConfig();
    return () => {
      active = false;
    };
  }, [program, globalConfigPda]);

  useEffect(() => {
    let active = true;
    let listenerId: number | null = null;
    const connection = program.provider.connection;

    (async () => {
      listenerId = await connection.onProgramAccountChange(program.programId, () => {
        if (active) {
          void refreshMerchantPlans();
        }
      });
    })();

    return () => {
      active = false;
      if (listenerId !== null) {
        void connection.removeProgramAccountChangeListener(listenerId);
      }
    };
  }, [program, refreshMerchantPlans]);

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const priceInUnits = parseUsdcToBn(pricePerPeriod);
      const minDepositInUnits = parseUsdcToBn(minDeposit);
      const periodSeconds = periodDaysToSeconds(periodDays);

      const merchantPlanPda = getMerchantPlanPda(program.programId, merchant);
      const vaultPda = getVaultPda(program.programId, merchantPlanPda);

      const signature = await program.methods
        .createPlan(priceInUnits, periodSeconds, minDepositInUnits)
        .accounts({
          merchant,
          globalConfig: globalConfigPda,
          merchantPlan: merchantPlanPda,
          vault: vaultPda,
          merchantTokenMint: usdcMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      onTx(signature, "createPlan");
      setSuccess("Plan created successfully.");
      await refreshMerchantPlans();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeConfig = async () => {
    setIsInitializing(true);
    setError(null);
    setSuccess(null);

    try {
      // Default values: 5% annual yield (500 bps), 1% protocol fee (100 bps)
      const annualYieldBps = 500;
      const protocolFeeBps = 100;

      const signature = await program.methods
        .initializeConfig(merchant, annualYieldBps, protocolFeeBps)
        .accounts({
          globalConfig: globalConfigPda,
          payer: merchant,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      onTx(signature, "initializeConfig");
      setSuccess("Global config initialized successfully.");
      setGlobalConfigExists(true);
    } catch (initError) {
      setError(getErrorMessage(initError));
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Plan Card */}
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Create Merchant Plan</h2>

        {globalConfigExists === false && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Note:</span> Global config is missing. You need to initialize it before creating plans.
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                onClick={() => void handleInitializeConfig()}
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Initializing...
                  </>
                ) : "Initialize Config"}
              </button>
            </div>
          </div>
        )}

        <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={handleCreatePlan}>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2" htmlFor="pricePerPeriod">
              Price Per Period (USDC)
            </label>
            <input
              id="pricePerPeriod"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              type="number"
              min="0"
              step="0.000001"
              value={pricePerPeriod}
              onChange={(event) => setPricePerPeriod(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2" htmlFor="periodDays">
              Period (days)
            </label>
            <select
              id="periodDays"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
              value={periodDays}
              onChange={(event) => setPeriodDays(Number(event.target.value) as (typeof PERIOD_OPTIONS)[number])}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2" htmlFor="minDeposit">
              Min Deposit (USDC)
            </label>
            <input
              id="minDeposit"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              type="number"
              min="0"
              step="0.000001"
              value={minDeposit}
              onChange={(event) => setMinDeposit(event.target.value)}
              required
            />
          </div>

          <div className="md:col-span-3">
            <button
              className="inline-flex items-center justify-center px-6 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : "Create Plan"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-600">{success}</p>
          </div>
        )}
      </section>

      {/* Plans List */}
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Your Plans</h2>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            onClick={() => void refreshMerchantPlans()}
            type="button"
            disabled={loadingPlans}
          >
            {loadingPlans && <span className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-600 rounded-full animate-spin" />}
            {loadingPlans ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-8 text-center">
            <p className="text-sm text-neutral-500">No plans found for merchant <span className="font-mono text-neutral-700">{shortPk(merchant)}</span>.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <article key={plan.publicKey.toBase58()} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 hover:shadow-md transition-shadow">
                <p className="font-mono text-xs text-neutral-400 mb-3">{plan.publicKey.toBase58()}</p>
                <div className="grid gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Price:</span>
                    <span className="font-medium text-neutral-900">{formatUsdc(plan.account.pricePerPeriod)} USDC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Period:</span>
                    <span className="font-medium text-neutral-900">{periodSecondsToDays(plan.account.periodSeconds)} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Min deposit:</span>
                    <span className="font-medium text-neutral-900">{formatUsdc(plan.account.minDeposit)} USDC</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
