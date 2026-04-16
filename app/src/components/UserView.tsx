import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMerchantPlans } from "../hooks/useMerchantPlans";
import { useUserSubscriptions } from "../hooks/useUserSubscriptions";
import type { YieldSubscriptions } from "../lib/program";
import { USDC_MINT } from "../lib/program";
import { getUserSubscriptionPda } from "../lib/pdas";
import { getErrorMessage } from "../lib/errors";
import { formatUsdc, parseUsdcToBn, periodSecondsToDays } from "../lib/usdc";
import type { ProgramAccount, UserSubscriptionAccount } from "../types/accounts";
import { RefreshCw, CreditCard, RotateCw, XCircle, AlertCircle, TrendingUp, CheckCircle } from "lucide-react";

interface UserViewProps {
  program: Program<YieldSubscriptions>;
  user: PublicKey;
  globalConfigPda: PublicKey;
  onTx: (signature: string, label: string) => void;
}

function formatStatus(status: number): string {
  return status === 0 ? "Active" : "Canceled";
}

function formatTimestamp(unixSeconds: string): string {
  const value = Number(unixSeconds);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Date(value * 1000).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function UserView({ program, user, globalConfigPda, onTx }: UserViewProps) {
  const { plans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useMerchantPlans(program);
  const {
    subscriptions,
    loading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useUserSubscriptions(program, user);

  const [depositValues, setDepositValues] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("—");
  const [solBalance, setSolBalance] = useState<string>("—");

  const fetchBalances = useCallback(async () => {
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, user);
      const info = await program.provider.connection.getAccountInfo(ata);
      if (info) {
        const account = await getAccount(program.provider.connection, ata);
        setUsdcBalance(formatUsdc(account.amount));
      } else {
        setUsdcBalance("0");
      }
    } catch {
      setUsdcBalance("0");
    }

    try {
      const solLamports = await program.provider.connection.getBalance(user);
      setSolBalance((solLamports / LAMPORTS_PER_SOL).toFixed(4));
    } catch {
      setSolBalance("0");
    }
  }, [program, user]);

  useEffect(() => {
    void fetchBalances();
  }, [fetchBalances]);

  const subscriptionsByPlan = useMemo(() => {
    const map = new Map<string, ProgramAccount<UserSubscriptionAccount>>();
    for (const subscription of subscriptions) {
      map.set(subscription.account.plan.toBase58(), subscription);
    }
    return map;
  }, [subscriptions]);

  const refreshAll = async () => {
    await Promise.all([refetchPlans(), refetchSubscriptions(), fetchBalances()]);
  };

  const ensureAta = async (owner: PublicKey, mint: PublicKey, payer: PublicKey) => {
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const info = await program.provider.connection.getAccountInfo(tokenAccount);
    if (info) return { address: tokenAccount };
    return {
      address: tokenAccount,
      createIx: createAssociatedTokenAccountInstruction(payer, tokenAccount, owner, mint),
    };
  };

  const handleSubscribe = async (planPubkey: PublicKey) => {
    const plan = plans.find((item) => item.publicKey.equals(planPubkey));
    if (!plan) return;
    const actionKey = `subscribe:${planPubkey.toBase58()}`;
    setBusyAction(actionKey);
    setActionError(null);

    try {
      const rawDeposit = depositValues[planPubkey.toBase58()] || "0";
      const initialDeposit = parseUsdcToBn(rawDeposit);
      const userToken = await ensureAta(user, plan.account.tokenMint, user);
      const preInstructions = userToken.createIx ? [userToken.createIx] : [];
      const userSubscriptionPda = getUserSubscriptionPda(program.programId, plan.publicKey, user);

      const signature = await program.methods
        .subscribe(initialDeposit)
        .accounts({
          user, merchantPlan: plan.publicKey, userSubscription: userSubscriptionPda,
          vault: plan.account.vault, userTokenAccount: userToken.address,
          tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
        })
        .preInstructions(preInstructions)
        .rpc();

      onTx(signature, "subscribe");
      await refreshAll();
    } catch (subscribeError) {
      setActionError(getErrorMessage(subscribeError));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSettle = async (planPubkey: PublicKey) => {
    const plan = plans.find((item) => item.publicKey.equals(planPubkey));
    const subscription = subscriptionsByPlan.get(planPubkey.toBase58());
    if (!plan || !subscription) return;
    const actionKey = `settle:${planPubkey.toBase58()}`;
    setBusyAction(actionKey);
    setActionError(null);

    try {
      const merchantToken = await ensureAta(plan.account.merchant, plan.account.tokenMint, user);
      const preInstructions = merchantToken.createIx ? [merchantToken.createIx] : [];
      const signature = await program.methods
        .settle()
        .accounts({
          globalConfig: globalConfigPda, merchantPlan: plan.publicKey,
          userSubscription: subscription.publicKey, planVault: plan.account.vault,
          merchantTokenAccount: merchantToken.address, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      onTx(signature, "settle");
      await refreshAll();
    } catch (settleError) {
      setActionError(getErrorMessage(settleError));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancel = async (planPubkey: PublicKey) => {
    const plan = plans.find((item) => item.publicKey.equals(planPubkey));
    const subscription = subscriptionsByPlan.get(planPubkey.toBase58());
    if (!plan || !subscription) return;
    const actionKey = `cancel:${planPubkey.toBase58()}`;
    setBusyAction(actionKey);
    setActionError(null);

    try {
      const userToken = await ensureAta(user, plan.account.tokenMint, user);
      const merchantToken = await ensureAta(plan.account.merchant, plan.account.tokenMint, user);
      const preInstructions = [userToken.createIx, merchantToken.createIx].filter(Boolean) as TransactionInstruction[];

      const signature = await program.methods
        .cancel()
        .accounts({
          user, globalConfig: globalConfigPda, merchantPlan: plan.publicKey,
          userSubscription: subscription.publicKey, plan: plan.publicKey,
          planVault: plan.account.vault, userTokenAccount: userToken.address,
          merchantTokenAccount: merchantToken.address, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();

      onTx(signature, "cancel");
      await refreshAll();
    } catch (cancelError) {
      setActionError(getErrorMessage(cancelError));
    } finally {
      setBusyAction(null);
    }
  };

  const isLoading = plansLoading || subscriptionsLoading;
  const combinedError = plansError || subscriptionsError || actionError;

  return (
    <section className="panel animate-fade-in" style={{ animationDelay: "100ms" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.75rem", fontFamily: "Outfit" }}>Available Plans</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "0.5rem 1rem", background: "rgba(0,0,0,0.3)", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>SOL</span>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{solBalance}</span>
            </div>
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>USDC</span>
              <span className="text-gradient" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{usdcBalance}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-secondary" type="button" onClick={() => void refreshAll()} disabled={isLoading} style={{ padding: "0.5rem 1rem", height: "auto" }}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Errors ── */}
      {combinedError && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: "0.875rem", margin: 0 }}>{combinedError}</p>
        </div>
      )}

      {/* ── Plans List ── */}
      {isLoading && plans.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="skeleton" style={{ height: "180px", width: "100%", borderRadius: "16px" }} />
          <div className="skeleton" style={{ height: "180px", width: "100%", borderRadius: "16px" }} />
        </div>
      ) : plans.length === 0 ? (
        <div style={{ padding: "3rem 2rem", textAlign: "center", background: "rgba(0,0,0,0.3)", borderRadius: 16, border: "1px dashed var(--glass-border)" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0 }}>No merchant plans available yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {plans.map((plan, i) => {
            const planKey = plan.publicKey.toBase58();
            const subscription = subscriptionsByPlan.get(planKey);
            const actionPrefix = busyAction?.split(":")[0];
            const isBusy = busyAction?.endsWith(planKey);
            const isActive = subscription?.account.status === 0;

            return (
              <article key={planKey} className="panel-inner" style={{ position: "relative", overflow: "hidden", animationDelay: `${i * 100}ms` }}>
                {isActive && (
                  <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "linear-gradient(to bottom, var(--accent-tertiary), #10b981)", boxShadow: "0 0 10px rgba(52, 211, 153, 0.5)" }} />
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "Outfit", fontWeight: 600, color: "var(--text-primary)", fontSize: "1.1rem" }}>Premium Plan</span>
                  <p style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, background: "rgba(0,0,0,0.4)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                    {planKey.slice(0, 6)}…{planKey.slice(-6)}
                  </p>
                </div>

                {/* Plan info */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Price</span>
                    <div style={{ fontWeight: 600, marginTop: "0.3rem", fontSize: "1.05rem", color: "var(--text-primary)" }}>{formatUsdc(plan.account.pricePerPeriod)} USDC</div>
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

                {!subscription ? (
                  /* ── Subscribe form ── */
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <div style={{ flex: 1 }}>
                      <input className="input" type="number" min="0" step="0.000001" placeholder="Deposit amount (USDC)" value={depositValues[planKey] ?? ""} onChange={(e) => setDepositValues((prev) => ({ ...prev, [planKey]: e.target.value }))} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border)" }} />
                    </div>
                    <button className="btn-primary" type="button" onClick={() => void handleSubscribe(plan.publicKey)} disabled={Boolean(busyAction)} style={{ padding: "0 1.5rem", height: "3rem" }}>
                      {isBusy && actionPrefix === "subscribe" ? <><span className="spinner spinner-sm" /> Processing…</> : <><CreditCard size={18} /> Subscribe</>}
                    </button>
                  </div>
                ) : (
                  /* ── Subscription info ── */
                  <div style={{ background: isActive ? "rgba(52, 211, 153, 0.03)" : "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "1.25rem", border: "1px solid var(--border)", position: "relative" }}>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Principal Left</span>
                        <div style={{ fontWeight: 700, marginTop: "0.3rem", fontSize: "1.1rem", color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {formatUsdc(subscription.account.principalRemaining)} USDC
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Status</span>
                        <div style={{ marginTop: "0.3rem" }}>
                          <span className={isActive ? "badge badge-active" : "badge badge-canceled"} style={{ padding: "0.25rem 0.5rem", fontSize: "0.65rem" }}>
                            {isActive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} className="animate-pulse-dot" />}
                            {formatStatus(subscription.account.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Last Settlement</span>
                        <div style={{ fontWeight: 500, marginTop: "0.3rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {formatTimestamp(subscription.account.lastSettlementTimestamp.toString())}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                      <button className="btn-secondary" type="button" onClick={() => void handleSettle(plan.publicKey)} disabled={Boolean(busyAction) || !isActive}>
                        {isBusy && actionPrefix === "settle" ? <><span className="spinner spinner-sm" /> Settling…</> : <><RotateCw size={16} /> Settle</>}
                      </button>
                      <button className="btn-danger" type="button" onClick={() => void handleCancel(plan.publicKey)} disabled={Boolean(busyAction) || !isActive}>
                        {isBusy && actionPrefix === "cancel" ? <><span className="spinner spinner-sm" /> Canceling…</> : <><XCircle size={16} /> Cancel</>}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
