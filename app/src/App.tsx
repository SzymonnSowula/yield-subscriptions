import { useMemo, useState } from "react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MerchantView } from "./components/MerchantView";
import { UserView } from "./components/UserView";
import { Console } from "./components/Console";
import { LandingPage } from "./components/LandingPage";
import { getGlobalConfigPda } from "./lib/pdas";
import { PROGRAM_ID, USDC_MINT } from "./lib/program";
import { useAnchorProgram } from "./hooks/useAnchorProgram";
import type { TxLogItem } from "./types/tx";
import { Hexagon, LogOut, Code, User } from "lucide-react";

type ViewMode = "merchant" | "user";

function App() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const program = useAnchorProgram(connection, wallet);

  const [viewMode, setViewMode] = useState<ViewMode>("merchant");
  const [txLog, setTxLog] = useState<TxLogItem[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  const globalConfigPda = useMemo(() => getGlobalConfigPda(PROGRAM_ID), []);

  const pushTx = (signature: string, label: string) => {
    setTxLog((prev) => [{ signature, label, createdAt: Date.now() }, ...prev].slice(0, 12));
  };

  // Show landing page when wallet not connected or user hasn't entered dashboard
  if (!publicKey || !showDashboard) {
    return <LandingPage onConnected={() => setShowDashboard(true)} />;
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2.5rem",
          background: "rgba(10, 10, 12, 0.7)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--accent)", display: "flex", alignItems: "center" }}>
            <Hexagon size={28} strokeWidth={2.5} fill="rgba(240, 185, 11, 0.2)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "Outfit", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Vaulter
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <span className="badge badge-network">Devnet</span>
          <WalletDisconnectButton 
            className="btn-secondary" 
            style={{ height: "2.25rem", padding: "0 1rem", fontSize: "0.8rem", borderRadius: "8px" }} 
            startIcon={<LogOut size={14} />} 
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "2rem 2.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 className="section-title" style={{ fontSize: "2rem", margin: 0 }}>
            {viewMode === "merchant" ? "Merchant Portal" : "User Dashboard"}
          </h1>
          
          {/* ── Animated Tabs ── */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "14px", padding: "4px", border: "1px solid var(--border)", position: "relative" }}>
            <div style={{
              position: "absolute",
              top: 4, left: 4, bottom: 4,
              width: "calc(50% - 4px)",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              transform: `translateX(${viewMode === 'user' ? '100%' : '0'})`,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 0
            }} />
            
            <button
              onClick={() => setViewMode("merchant")}
              style={{
                position: "relative", zIndex: 1,
                padding: "0.625rem 1.5rem",
                background: "transparent", border: "none",
                fontSize: "0.875rem", fontWeight: 600, fontFamily: "Inter",
                color: viewMode === "merchant" ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer", transition: "color 0.3s",
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}
            >
              <Code size={16} /> Merchant
            </button>
            <button
              onClick={() => setViewMode("user")}
              style={{
                position: "relative", zIndex: 1,
                padding: "0.625rem 1.5rem",
                background: "transparent", border: "none",
                fontSize: "0.875rem", fontWeight: 600, fontFamily: "Inter",
                color: viewMode === "user" ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer", transition: "color 0.3s",
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}
            >
              <User size={16} /> Subscriber
            </button>
          </div>
        </div>

        {!program ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--text-muted)", gap: "1rem" }}>
            <span className="spinner" style={{ borderTopColor: "var(--accent)", width: 24, height: 24 }} />
            <span style={{ fontSize: "1rem", fontWeight: 500 }}>Initializing protocol layer…</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "2rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {viewMode === "merchant" ? (
                <MerchantView
                  program={program}
                  merchant={publicKey}
                  globalConfigPda={globalConfigPda}
                  usdcMint={USDC_MINT}
                  onTx={pushTx}
                />
              ) : (
                <UserView program={program} user={publicKey} globalConfigPda={globalConfigPda} onTx={pushTx} />
              )}
            </div>
            <Console items={txLog} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
