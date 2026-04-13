import { useMemo, useState } from "react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MerchantView } from "./components/MerchantView";
import { UserView } from "./components/UserView";
import { Console } from "./components/Console";
import { LandingPage } from "./components/LandingPage";
import { getGlobalConfigPda } from "./lib/pdas";
import { PROGRAM_ID, USDC_MINT } from "./lib/program";
import { useAnchorProgram } from "./hooks/useAnchorProgram";
import type { TxLogItem } from "./types/tx";

type ViewMode = "merchant" | "user";

function App() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const program = useAnchorProgram(connection, wallet);

  const [viewMode, setViewMode] = useState<ViewMode>("merchant");
  const [txLog, setTxLog] = useState<TxLogItem[]>([]);
  const [showLanding, setShowLanding] = useState(true);

  const globalConfigPda = useMemo(() => getGlobalConfigPda(PROGRAM_ID), []);

  const pushTx = (signature: string, label: string) => {
    setTxLog((prev) => [{ signature, label, createdAt: Date.now() }, ...prev].slice(0, 8));
  };

  const handleConnected = () => {
    setShowLanding(false);
  };

  if (showLanding && !publicKey) {
    return <LandingPage onConnected={handleConnected} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm">YS</div>
              <span className="font-semibold text-lg">
                <span className="text-neutral-900">Yield</span>
                <span className="text-violet-600"> Subscriptions</span>
              </span>
            </div>

            {/* Wallet */}
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100">Devnet</span>
              <WalletDisconnectButton className="!bg-neutral-900 !text-white !rounded-lg !px-4 !py-2 !text-sm !font-medium hover:!bg-neutral-800 transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-1 -mb-px">
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                viewMode === "merchant"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setViewMode("merchant")}
            >
              Merchant
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                viewMode === "user"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setViewMode("user")}
            >
              User
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {!program ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-neutral-500">
              <div className="w-5 h-5 border-2 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
              <span>Initializing program...</span>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {viewMode === "merchant" ? (
                <MerchantView
                  program={program}
                  merchant={publicKey!}
                  globalConfigPda={globalConfigPda}
                  usdcMint={USDC_MINT}
                  onTx={pushTx}
                />
              ) : (
                <UserView program={program} user={publicKey!} globalConfigPda={globalConfigPda} onTx={pushTx} />
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
