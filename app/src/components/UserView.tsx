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
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  return new Date(value * 1000).toLocaleString();
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
  const [usdcBalance, setUsdcBalance] = useState<string>("-");
  const [solBalance, setSolBalance] = useState<string>("-");

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
    await Promise.all([refetchPlans(), refetchSubscriptions()]);
  };

  const ensureAta = async (
    owner: PublicKey,
    mint: PublicKey,
    payer: PublicKey
  ): Promise<{ address: PublicKey; createIx?: TransactionInstruction }> => {
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const info = await program.provider.connection.getAccountInfo(tokenAccount);

    if (info) {
      return { address: tokenAccount };
    }

    return {
      address: tokenAccount,
      createIx: createAssociatedTokenAccountInstruction(payer, tokenAccount, owner, mint),
    };
  };

  const handleSubscribe = async (planPubkey: PublicKey) => {
    const plan = plans.find((item) => item.publicKey.equals(planPubkey));
    if (!plan) {
      return;
    }

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
          user,
          merchantPlan: plan.publicKey,
          userSubscription: userSubscriptionPda,
          vault: plan.account.vault,
          userTokenAccount: userToken.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
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
    if (!plan || !subscription) {
      return;
    }

    const actionKey = `settle:${planPubkey.toBase58()}`;
    setBusyAction(actionKey);
    setActionError(null);

    try {
      const merchantToken = await ensureAta(plan.account.merchant, plan.account.tokenMint, user);
      const preInstructions = merchantToken.createIx ? [merchantToken.createIx] : [];

      const signature = await program.methods
        .settle()
        .accounts({
          globalConfig: globalConfigPda,
          merchantPlan: plan.publicKey,
          userSubscription: subscription.publicKey,
          planVault: plan.account.vault,
          merchantTokenAccount: merchantToken.address,
          tokenProgram: TOKEN_PROGRAM_ID,
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
    if (!plan || !subscription) {
      return;
    }

    const actionKey = `cancel:${planPubkey.toBase58()}`;
    setBusyAction(actionKey);
    setActionError(null);

    try {
      const userToken = await ensureAta(user, plan.account.tokenMint, user);
      const merchantToken = await ensureAta(plan.account.merchant, plan.account.tokenMint, user);
      const preInstructions = [userToken.createIx, merchantToken.createIx].filter(
        (instruction): instruction is TransactionInstruction => Boolean(instruction)
      );

      const signature = await program.methods
        .cancel()
        .accounts({
          user,
          globalConfig: globalConfigPda,
          merchantPlan: plan.publicKey,
          userSubscription: subscription.publicKey,
          plan: plan.publicKey,
          planVault: plan.account.vault,
          userTokenAccount: userToken.address,
          merchantTokenAccount: merchantToken.address,
          tokenProgram: TOKEN_PROGRAM_ID,
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

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Available Merchant Plans</h2>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-neutral-500">Balance:</span>
            <span className="font-medium text-neutral-700">{solBalance} SOL</span>
            <span className="text-neutral-300">/</span>
            <span className="font-medium text-violet-600">{usdcBalance} USDC</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            type="button"
            onClick={() => void fetchBalances()}
          >
            Refresh Balance
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
            type="button"
            onClick={() => void refreshAll()}
            disabled={plansLoading}
          >
            {plansLoading && <span className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-600 rounded-full animate-spin" />}
            {plansLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Errors */}
      {(plansError || subscriptionsError || actionError) && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{plansError || subscriptionsError || actionError}</p>
        </div>
      )}

      {/* Loading */}
      {(plansLoading || subscriptionsLoading) && (
        <div className="mb-6 flex items-center gap-3 text-neutral-500">
          <span className="w-5 h-5 border-2 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
          <span className="text-sm">Loading on-chain accounts...</span>
        </div>
      )}

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-500">No merchant plans are available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const planKey = plan.publicKey.toBase58();
            const subscription = subscriptionsByPlan.get(planKey);
            const actionPrefix = busyAction?.split(":")[0];
            const isBusy = busyAction?.endsWith(planKey);

            return (
              <article key={planKey} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 hover:shadow-md transition-shadow">
                <p className="font-mono text-xs text-neutral-400 mb-3">{planKey}</p>

                <div className="grid gap-4 text-sm md:grid-cols-3 mb-4">
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

                {!subscription ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      className="flex-1 sm:max-w-xs px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-neutral-400"
                      type="number"
                      min="0"
                      step="0.000001"
                      placeholder="Initial deposit (USDC)"
                      value={depositValues[planKey] ?? ""}
                      onChange={(event) =>
                        setDepositValues((prev) => ({
                          ...prev,
                          [planKey]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="inline-flex items-center justify-center px-6 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      onClick={() => void handleSubscribe(plan.publicKey)}
                      disabled={Boolean(busyAction)}
                    >
                      {isBusy && actionPrefix === "subscribe" ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Subscribing...
                        </>
                      ) : "Subscribe"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 text-sm md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Principal remaining:</span>
                        <span className="font-medium text-neutral-900">{formatUsdc(subscription.account.principalRemaining)} USDC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Status:</span>
                        <span className={`font-medium ${subscription.account.status === 0 ? 'text-emerald-600' : 'text-neutral-500'}`}>
                          {formatStatus(subscription.account.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Last settlement:</span>
                        <span className="font-medium text-neutral-900">{formatTimestamp(subscription.account.lastSettlementTimestamp.toString())}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        onClick={() => void handleSettle(plan.publicKey)}
                        disabled={Boolean(busyAction) || subscription.account.status !== 0}
                      >
                        {isBusy && actionPrefix === "settle" ? (
                          <>
                            <span className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-600 rounded-full animate-spin mr-2" />
                            Settling...
                          </>
                        ) : "Settle"}
                      </button>
                      <button
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        onClick={() => void handleCancel(plan.publicKey)}
                        disabled={Boolean(busyAction) || subscription.account.status !== 0}
                      >
                        {isBusy && actionPrefix === "cancel" ? (
                          <>
                            <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-600 rounded-full animate-spin mr-2" />
                            Canceling...
                          </>
                        ) : "Cancel"}
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
