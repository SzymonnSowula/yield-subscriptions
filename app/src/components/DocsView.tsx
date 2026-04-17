import { Book, Shield, Zap, Database, Lock, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export function DocsView() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Hero Section */}
      <div className="panel gradient-border-card" style={{ padding: "3rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="bg-glow" style={{ opacity: 0.5 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-black/40 border border-white/10 mb-6">
            <Book size={32} className="text-accent" />
          </div>
          <h1 className="section-title text-gradient mb-4">Vaulter Architecture & Protocol</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.125rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            A deep dive into the underlying architecture, program state logic, and integration methods of the Vaulter on-chain protocol on Solana.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="hidden md:block col-span-1">
          <div className="panel" style={{ position: "sticky", top: "100px" }}>
            <h3 className="font-outfit text-xl font-bold mb-6 flex items-center gap-2">
              <Book size={20} className="text-accent" /> Contents
            </h3>
            <ul className="flex flex-col gap-3 space-y-1">
              <li>
                <a href="#core-mechanics" className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  1. Core Mechanics
                </a>
              </li>
              <li>
                <a href="#state-management" className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  2. State Management
                </a>
              </li>
              <li>
                <a href="#kamino-engine" className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  3. Kamino Integration
                </a>
              </li>
              <li>
                <a href="#settle-mechanism" className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  4. Settle Mechanism
                </a>
              </li>
              <li>
                <a href="#security" className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  5. Security & Risk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
          
          {/* Section 1 */}
          <div id="core-mechanics" className="panel scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Zap size={24} />
              </div>
              <h2 className="font-outfit text-2xl font-bold">1. Core Mechanics</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-6">
              Vaulter turns a <strong>capital expense (subscription)</strong> into a <strong>capital investment (yield)</strong>.
              Instead of users streaming funds or locking tokens into escrow to be slowly depleted, they lock a core deposit (Principal). The Vaulter protocol manages this deposit, delegates it to external DeFi yield engines (like Kamino Finance), and uses the generated yield to natively settle the merchant's recurring cost.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="panel-inner text-center">
                <Shield size={20} className="text-accent mx-auto mb-2" />
                <h4 className="font-bold text-sm mb-1">Principal Protected</h4>
                <p className="text-xs text-text-muted">User's deposit is mathematically segregated.</p>
              </div>
              <div className="panel-inner text-center">
                <Zap size={20} className="text-accent mx-auto mb-2" />
                <h4 className="font-bold text-sm mb-1">Permissionless</h4>
                <p className="text-xs text-text-muted">Settlements executed by cranks/keepers.</p>
              </div>
              <div className="panel-inner text-center">
                <Database size={20} className="text-accent mx-auto mb-2" />
                <h4 className="font-bold text-sm mb-1">Deterministic</h4>
                <p className="text-xs text-text-muted">100% PDA architecture. No admin keys.</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div id="state-management" className="panel scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Database size={24} />
              </div>
              <h2 className="font-outfit text-2xl font-bold">2. On-Chain State Management</h2>
            </div>
            
            <div className="alert alert-warning mb-6">
              <Info size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Note:</strong> All accounts are derived natively using constant seeds. Because of this, the frontend never tracks user IDs—it independently calculates states based on wallet keys and the hardcoded program ID.
              </div>
            </div>

            <div className="space-y-6">
              <div className="panel-inner bg-black/40 border-l-2 border-l-purple-500">
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  Global Config <span className="badge badge-network text-[10px]">PDA: b"config"</span>
                </h3>
                <p className="text-sm text-text-muted mb-3">A singleton PDA initialized by the protocol admin.</p>
                <ul className="text-sm space-y-2 text-text-secondary">
                  <li><span className="text-accent font-mono">admin</span>: Authority capable of adjustments.</li>
                  <li><span className="text-accent font-mono">annual_yield_bps</span>: Target yield (1000 = 10% APY).</li>
                  <li><span className="text-accent font-mono">protocol_fee_bps</span>: Protocol tax on settlements.</li>
                </ul>
              </div>

              <div className="panel-inner bg-black/40 border-l-2 border-l-blue-500">
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  Merchant Plan <span className="badge badge-network text-[10px]">PDA: b"plan", merchant</span>
                </h3>
                <p className="text-sm text-text-muted mb-3">Represents a predefined subscription offering.</p>
                <ul className="text-sm space-y-2 text-text-secondary">
                  <li><span className="text-accent font-mono">merchant</span>: Creator of the plan & receiver of yield.</li>
                  <li><span className="text-accent font-mono">price_per_period</span>: Expected USDC per cycle.</li>
                  <li><span className="text-accent font-mono">billing_period</span>: Cycle length in seconds.</li>
                  <li><span className="text-accent font-mono">min_deposit_amount</span>: Threshold to lock.</li>
                </ul>
              </div>

              <div className="panel-inner bg-black/40 border-l-2 border-l-green-500">
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  User Subscription <span className="badge badge-network text-[10px]">PDA: b"sub", plan, user</span>
                </h3>
                <p className="text-sm text-text-muted mb-3">Relationship linking a user to a Merchant Plan.</p>
                <ul className="text-sm space-y-2 text-text-secondary">
                  <li><span className="text-accent font-mono">user</span>: Wallet that owns the principal.</li>
                  <li><span className="text-accent font-mono">deposit_amount</span>: Exact active balance locked.</li>
                  <li><span className="text-accent font-mono">last_settled_at</span>: Timestamp of last billing.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div id="kamino-engine" className="panel scroll-mt-24 border-t-2 border-t-accent">
            <h2 className="font-outfit text-2xl font-bold mb-6">3. Kamino Finance Integration</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Vaulter doesn't hold the funds statically. Through Cross-Program Invocations (CPI), the Vault deposits incoming USDC into <strong>Kamino Finance Lending Pools</strong>.
            </p>
            <div className="bg-black/50 rounded-xl p-6 border border-white/5 mb-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-accent/5 rounded-bl-full border-b border-l border-accent/10" />
              <ol className="relative z-10 flex flex-col gap-4">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p className="text-text-primary text-sm mt-1.5">User deposits 1000 USDC.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p className="text-text-primary text-sm mt-1.5">Vaulter takes the USDC, sends it to the Kamino Vault via CPI <code className="text-xs bg-black px-1.5 py-0.5 rounded text-accent">kamino_deposit</code>.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p className="text-text-primary text-sm mt-1.5">Vaulter receives <code className="text-xs bg-black px-1.5 py-0.5 rounded text-accent">kUSDC</code> (Kamino yield-bearing LP tokens) into the PDA.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <p className="text-text-primary text-sm mt-1.5">The Vault's value inherently grows compared to the anchored principal.</p>
                </li>
              </ol>
            </div>
            
            <div className="alert alert-success">
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Protocol Agnostic:</strong> While heavily optimized for Kamino, the internal trait system allows integrating Solend, Marginfi, or standard Jito SOL staking derivatives in future versions.
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div id="settle-mechanism" className="panel scroll-mt-24">
            <h2 className="font-outfit text-2xl font-bold mb-6">4. The Settle Mechanism</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              The heart of Vaulter is the <code className="text-accent bg-accent/10 px-1 py-0.5 rounded">settle</code> instruction. Because Solana lacks native cron jobs, settlements must be triggered.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 mt-1">
                  <Zap size={16} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary whitespace-nowrap">Trigger Phase</h4>
                  <p className="text-sm text-text-muted">A keeper (or the merchant themselves) fires settle on a specific UserSubscription.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 mt-1">
                  <CheckCircle2 size={16} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary whitespace-nowrap">Time Validation</h4>
                  <p className="text-sm text-text-muted">Smart contract verifies <code className="text-xs bg-black px-1 py-0.5 rounded">current_time &gt;= last_settled_at + billing_period</code>.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 mt-1">
                  <Database size={16} className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary whitespace-nowrap">Yield Realization</h4>
                  <p className="text-sm text-text-muted">Withdraws enough kUSDC from Kamino to cover the price_per_period.</p>
                </div>
              </div>
            </div>

            <div className="alert alert-warning bg-[#1e293b]/50 border-blue-500/30 text-blue-200">
              <Info size={20} className="flex-shrink-0 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <strong>Guaranteed Solvency:</strong> If a user cancels early or yield doesn't cover the period, the user's principal is fully refunded up to the pro-rata unhandled period.
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div id="security" className="panel scroll-mt-24 border-t-2 border-red-500/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <Lock size={24} />
              </div>
              <h2 className="font-outfit text-2xl font-bold">5. Security & Risk</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="panel-inner border border-red-500/20 bg-red-500/5">
                <AlertTriangle size={20} className="text-red-400 mb-3" />
                <h4 className="font-bold text-sm mb-2 text-white">Smart Contract Risk</h4>
                <p className="text-xs text-text-muted">Vaulter absorbs Kamino's risk. Localized kUSDC tokens in the Vaulter PDA could lose value if Kamino is exploited.</p>
              </div>
              <div className="panel-inner border border-green-500/20 bg-green-500/5">
                <Shield size={20} className="text-green-400 mb-3" />
                <h4 className="font-bold text-sm mb-2 text-white">No Admin Withdrawals</h4>
                <p className="text-xs text-text-muted">Protocol owner cannot withdraw from the Vault PDA. Anchor Constraints restrict cross-contamination.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
