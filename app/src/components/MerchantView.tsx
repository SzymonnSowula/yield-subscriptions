import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import type { YieldSubscriptions } from "../lib/program";
import { getMerchantPlanPda, getVaultPda } from "../lib/pdas";
import { getErrorMessage } from "../lib/errors";
import { formatUsdc, parseUsdcToBn, periodDaysToSeconds, periodSecondsToDays } from "../lib/usdc";
import type { MerchantPlanAccount, ProgramAccount } from "../types/accounts";
import { RefreshCw, Plus, AlertCircle, CheckCircle2, Settings } from "lucide-react";

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
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
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
        if (active) setGlobalConfigExists(Boolean(info));
      } catch {
        if (active) setGlobalConfigExists(false);
      }
    };
    void checkConfig();
    return () => { active = false; };
  }, [program, globalConfigPda]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* ── Create Plan ── */}
      <section className="panel animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem", fontFamily: "Outfit" }}>Create Merchant Plan</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
          Define the pricing and billing period for your subscription offering.
        </p>

        {globalConfigExists === false && (
          <div className="alert alert-warning" style={{ marginBottom: "1.5rem" }}>
            <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", width: "100%" }}>
              <p style={{ fontSize: "0.875rem", margin: 0, fontWeight: 500 }}>
                Protocol global config is missing. It must be initialized once by the admin.
              </p>
              <button className="btn-primary" onClick={() => void handleInitializeConfig()} disabled={isInitializing} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto" }}>
                {isInitializing ? <><span className="spinner spinner-sm" /> Initializing…</> : <><Settings size={14} /> Initialize Config</>}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreatePlan} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          <div>
            <label className="label" htmlFor="pricePerPeriod">Price / Period (USDC)</label>
            <input id="pricePerPeriod" className="input" type="number" min="0" step="0.000001" value={pricePerPeriod} onChange={(e) => setPricePerPeriod(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="periodDays">Billing Period</label>
            <select id="periodDays" className="input" value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value) as (typeof PERIOD_OPTIONS)[number])}>
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt} Days</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minDeposit">Min Deposit (USDC)</label>
            <input id="minDeposit" className="input" type="number" min="0" step="0.000001" value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} required />
          </div>
          <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
            <button className="btn-primary w-full" type="submit" disabled={isSubmitting || globalConfigExists === false} style={{ width: "100%" }}>
              {isSubmitting ? <><span className="spinner spinner-sm" /> Processing Transaction…</> : <><Plus size={18} /> Launch Subscription Plan</>}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginTop: "1rem" }}>
            <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.875rem", margin: 0 }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginTop: "1rem" }}>
            <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.875rem", margin: 0 }}>{success}</p>
          </div>
        )}
      </section>

      {/* ── Plans List ── */}
      <section className="panel animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, fontFamily: "Outfit" }}>Active Plans</h2>
          <button className="btn-secondary" onClick={() => void refreshMerchantPlans()} type="button" disabled={loadingPlans} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto" }}>
            <RefreshCw size={14} className={loadingPlans ? "animate-spin" : ""} style={{ animation: loadingPlans ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
        </div>

        {loadingPlans && plans.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="skeleton" style={{ height: "120px", width: "100%", borderRadius: "16px" }} />
            <div className="skeleton" style={{ height: "120px", width: "100%", borderRadius: "16px" }} />
          </div>
        ) : plans.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", background: "rgba(0,0,0,0.3)", borderRadius: 16, border: "1px dashed var(--glass-border)" }}>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0 }}>
              No plans found. Create your first plan above to start accepting subscriptions.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {plans.map((plan, i) => (
              <article key={plan.publicKey.toBase58()} className="panel-inner" style={{ animationDelay: `${i * 100}ms` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "Outfit", fontWeight: 600, color: "var(--text-primary)" }}>Plan #{i + 1}</span>
                  <p style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, background: "rgba(0,0,0,0.4)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                    {shortPk(plan.publicKey)}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", fontSize: "0.875rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Price</span>
                    <div style={{ fontWeight: 600, marginTop: "0.3rem", fontSize: "1.05rem", color: "var(--accent)" }}>{formatUsdc(plan.account.pricePerPeriod)} USDC</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Period</span>
                    <div style={{ fontWeight: 600, marginTop: "0.3rem", fontSize: "1.05rem" }}>{periodSecondsToDays(plan.account.periodSeconds)} Days</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Min Deposit</span>
                    <div style={{ fontWeight: 600, marginTop: "0.3rem", fontSize: "1.05rem" }}>{formatUsdc(plan.account.minDeposit)} USDC</div>
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
