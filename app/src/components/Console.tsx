import type { TxLogItem } from "../types/tx";
import { Terminal, ExternalLink } from "lucide-react";

interface ConsoleProps {
  items: TxLogItem[];
}

export function Console({ items }: ConsoleProps) {
  return (
    <section className="console-container animate-fade-in" style={{ alignSelf: "start", position: "sticky", top: "7rem", border: "1px solid var(--border)" }}>
      {/* ── Console Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Terminal size={16} color="var(--text-muted)" />
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", margin: 0, fontFamily: "Inter" }}>
            Network Log
          </h3>
        </div>
        <span className="badge" style={{ background: "rgba(52, 211, 153, 0.1)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)", padding: "0.2rem 0.6rem" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} className="animate-pulse-dot" />
          Live
        </span>
      </div>

      {/* ── Console Body ── */}
      {items.length === 0 ? (
        <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <Terminal size={32} color="var(--text-muted)" style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0, fontFamily: "monospace" }}>&gt; awaiting transactions...</p>
        </div>
      ) : (
        <ul className="console-list" style={{ listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item, i) => (
            <li
              key={`${item.signature}-${i}`}
              className="reveal"
              style={{
                padding: "1rem",
                background: "rgba(52, 211, 153, 0.05)",
                borderLeft: "2px solid #34d399",
                borderRadius: "0 6px 6px 0",
                animation: "fade-in 0.3s ease-out forwards"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize", color: "#f8fafc", fontFamily: "Inter" }}>
                  {item.label}
                </span>
                <a
                  style={{
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    fontSize: "0.7rem", fontWeight: 600, color: "var(--accent-secondary)",
                    textDecoration: "none", transition: "opacity 0.2s"
                  }}
                  href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <ExternalLink size={12} /> Explorer
                </a>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace", fontSize: "0.65rem", color: "#34d399" }}>
                <span>&gt;</span>
                <span style={{ wordBreak: "break-all", opacity: 0.8 }}>{item.signature}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
