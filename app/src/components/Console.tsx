import type { TxLogItem } from "../types/tx";

interface ConsoleProps {
  items: TxLogItem[];
}

export function Console({ items }: ConsoleProps) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Transactions</h3>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100">Live</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-6 text-center">
          <p className="text-sm text-neutral-500">No transactions yet</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item) => (
            <li key={item.signature} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-900 capitalize">{item.label}</span>
                <a
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                  href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View →
                </a>
              </div>
              <p className="font-mono text-xs text-neutral-400 truncate">{item.signature}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
