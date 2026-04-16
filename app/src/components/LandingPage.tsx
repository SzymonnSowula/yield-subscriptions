import React, { useEffect, useState, useRef, Suspense } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Hexagon, Shield, Zap, TrendingUp, Wallet, Search, ArrowDownToLine, Sparkles, ChevronDown, MessageCircle, Terminal, Globe, RefreshCw, BarChart3, Fingerprint, Unlock, Users, Database } from "lucide-react";

const ParticleField = React.lazy(() => import("./ParticleField").then(module => ({ default: module.ParticleField })));

interface LandingPageProps {
  onConnected: () => void;
}

const faqs = [
  {
    q: "How does Yield Subscriptions work?",
    a: "Merchants create subscription plans with custom pricing and periods. Users deposit USDC and earn yield while their subscription is active. Settlements happen automatically each period — yield covers the subscription cost so your principal stays intact longer.",
  },
  {
    q: "Is my deposit safe?",
    a: "Funds are held in program-controlled vaults on the Solana blockchain. No admin keys can access your funds. The protocol uses Anchor smart contracts with PDA-derived vault authority.",
  },
  {
    q: "What are the fees?",
    a: "A small protocol fee (configurable in basis points) is applied to each settlement. The exact fee is transparently displayed before you subscribe to any plan.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes — cancel anytime. Any accrued fees are settled first, and your remaining principal is returned to your wallet immediately in the same transaction.",
  },
];

// Hook for scroll reveal animation
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Custom hook for animated counter
function useCountUp(end: number, duration: number = 2000, suffix: string = "") {
  const [count, setCount] = useState("0");
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let observer: IntersectionObserver;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function outExpo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = (easeOut * end).toFixed(end % 1 !== 0 ? 1 : 0);
      
      setCount(`${current}${suffix}`);

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      }
    };

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        window.requestAnimationFrame(animate);
        observer.disconnect();
      }
    });

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, suffix]);

  return { count, countRef };
}

function AnimatedStat({ value, label, suffix = "", delay = 0 }: { value: number, label: string, suffix?: string, delay?: number }) {
  const { count, countRef } = useCountUp(value, 2000, suffix);
  
  return (
    <div ref={countRef} className={`reveal reveal-delay-${delay}`} style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", fontFamily: "Outfit" }}>
        {count}
      </span>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter" }}>
        {label}
      </span>
    </div>
  );
}

export function LandingPage({ onConnected }: LandingPageProps) {
  const wallet = useAnchorWallet();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useScrollReveal();

  useEffect(() => {
    if (wallet) {
      onConnected();
    }
  }, [wallet, onConnected]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <Suspense fallback={<div style={{ position: "absolute", inset: 0, backgroundColor: "#020203", zIndex: 0 }} />}>
        <ParticleField />
      </Suspense>
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* ── Navigation ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: scrolled ? "1rem 2.5rem" : "1.5rem 2.5rem",
          background: scrolled ? "rgba(2, 2, 3, 0.75)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--accent)", display: "flex", alignItems: "center" }}>
            <Hexagon size={28} strokeWidth={2.5} fill="rgba(240, 185, 11, 0.2)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)", fontFamily: "Outfit", letterSpacing: "-0.01em" }}>
            Yield <span style={{ color: "var(--accent)" }}>Subscriptions</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <div style={{ gap: "2rem", display: window.innerWidth > 768 ? "flex" : "none" }}>
            <a href="#features" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
              Features
            </a>
            <a href="#how" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
              How it works
            </a>
            <a href="#faq" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
              FAQ
            </a>
          </div>
          <WalletMultiButton className="connect-btn-nav" startIcon={<Wallet size={16} />} />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "100vh",
          padding: "8rem 4rem 4rem",
          maxWidth: 1280,
          margin: "0 auto",
          gap: "4rem",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          {/* Badge */}
          <div className="badge badge-live reveal" style={{ marginBottom: "2rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} className="animate-pulse-dot" />
            V1 Protocol Live on Devnet
          </div>

          {/* Title */}
          <h1 className="section-title reveal reveal-delay-1" style={{ fontSize: "4.5rem", marginBottom: "1.5rem" }}>
            Subscribe. <br />
            <span className="text-gradient">Earn Yield.</span> <br />
            Stay in Control.
          </h1>

          {/* Subtitle */}
          <p className="reveal reveal-delay-2" style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              marginBottom: "3rem",
              maxWidth: 500,
            }}
          >
            Deposit USDC into merchant plans. Your deposit generates yield that
            pays subscription fees — protecting your principal balance.
          </p>

          {/* CTA */}
          <div className="reveal reveal-delay-3" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -10, background: "var(--glow-gold)", filter: "blur(20px)", borderRadius: "50%", zIndex: -1 }}></div>
              <WalletMultiButton className="connect-btn" startIcon={<Wallet size={18} />} />
            </div>
            <a href="#features" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-primary)",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9375rem",
                transition: "all 0.2s",
              }}
            >
              Explore Protocol <ArrowDownToLine size={16} />
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -20, left: 0, fontSize: "0.6rem", color: "var(--accent-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}>
                <div style={{ width: 6, height: 6, background: "var(--accent-secondary)", borderRadius: "50%", boxShadow: "0 0 8px var(--accent-secondary)" }} />
                Powered by Kamino
              </div>
              <AnimatedStat value={12} suffix="%" label="Annual Yield" delay={1} />
            </div>
            <div style={{ width: 1, height: 40, background: "var(--border)" }}></div>
            <AnimatedStat value={0} label="Deposit Fees" delay={2} />
            <div style={{ width: 1, height: 40, background: "var(--border)" }}></div>
            <div className="reveal reveal-delay-3" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", fontFamily: "Outfit" }}>
                Instant
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter" }}>
                Settlements
              </span>
            </div>
          </div>
        </div>

        {/* Hero Visual — Glass Cards */}
        <div style={{ position: "relative", width: 420, height: 500, flexShrink: 0, display: window.innerWidth > 1024 ? "block" : "none" }}>
          {/* Main card */}
          <div className="gradient-border-card animate-float" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 320, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yield Earned</span>
              <TrendingUp size={20} color="var(--accent-tertiary)" />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: 700, fontFamily: "Outfit", background: "linear-gradient(135deg, var(--accent-tertiary), #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
              +12.4%
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "2rem" }}>Active this quarter</div>
            
            {/* Chart Simulation */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 70 }}>
              {[30, 45, 38, 60, 48, 75, 95].map((h, i) => (
                <div key={i} className="shimmer-effect" style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: 4,
                    background: i === 6 ? "linear-gradient(to top, var(--accent-tertiary), #10b981)" : "rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Float card — APY */}
          <div className="panel animate-float-delayed" style={{ position: "absolute", top: "10%", right: "-10%", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167, 139, 250, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-secondary)" }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target APY</div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, fontFamily: "Outfit" }}>10.0%</div>
            </div>
          </div>

          {/* Float card — Deposit */}
          <div className="panel animate-float" style={{ position: "absolute", bottom: "10%", left: "-15%", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", animationDelay: "3s" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(240, 185, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Secured Deposit</div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, fontFamily: "Outfit" }}>5,000 USDC</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section id="why" style={{ position: "relative", zIndex: 1, padding: "2rem 2rem 6rem", maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "Outfit", marginBottom: "1rem" }}>Why Yield Subscriptions?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>Simply and securely manage your recurring payments on-chain.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[
            { title: "Automated Settlements", desc: "Deposit once, subscriptions are paid automatically every period. No manual transfers.", icon: <RefreshCw size={90} strokeWidth={1} /> },
            { title: "Stay updated with on-chain data", desc: "Get the latest insights on your subscription spending and yields directly from Web3.", icon: <BarChart3 size={90} strokeWidth={1} /> },
            { title: "No Admin Keys", desc: "Smart contract vault logic ensures trustless control. Your funds remain yours.", icon: <Fingerprint size={90} strokeWidth={1} /> },
            { title: "Cancel and withdraw anytime", desc: "Enjoy quick and secure deposits, and withdraw your remaining principal anytime.", icon: <Unlock size={90} strokeWidth={1} /> },
            { title: "Open For Everyone", desc: "Easily integrate with any crypto-native business using our simple open-source program.", icon: <Users size={90} strokeWidth={1} /> },
            { title: "Save your assets, earn bonuses", desc: "Secure your holdings while earning passive yield that stretches your subscription runway.", icon: <Database size={90} strokeWidth={1} /> },
          ].map((item, i) => (
            <div key={i} className={`reveal reveal-delay-${i % 3 + 1}`} style={{ 
              background: "rgba(10, 10, 12, 0.8)", 
              borderRadius: "20px", 
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              height: "320px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem", fontFamily: "Outfit", color: "var(--text-primary)" }}>{item.title}</h3>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{item.desc}</p>
              </div>
              <div style={{ 
                  marginTop: "auto", 
                  alignSelf: "flex-end", 
                  color: "var(--accent)", 
                  opacity: 0.15,
                  transform: "rotate(-10deg) translate(20px, 20px)"
                }}>
                {item.icon}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ position: "relative", zIndex: 1, padding: "8rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ marginBottom: "1rem", color: "var(--accent)", letterSpacing: "0.2em", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Architecture</p>
          <h2 style={{ fontSize: "3rem", fontWeight: 700, fontFamily: "Outfit", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Built for the <span style={{ color: "var(--accent)" }}>future</span> of subscriptions
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {[
            { icon: <Shield size={20} strokeWidth={1.5} />, title: "Secure Vaults", desc: "Funds deposited into PDA-controlled vaults. No admin keys, no centralized risk. Math protects your deposit." },
            { icon: <Zap size={20} strokeWidth={1.5} />, title: "Auto Settlements", desc: "Permissionless settlement engine. Anyone can trigger it. Yield covers fees elegantly each billing period." },
            { icon: <TrendingUp size={20} strokeWidth={1.5} />, title: "Earn While You Pay", desc: "Your USDC generates yield. That yield pays subscription costs so your principal lasts significantly longer." },
          ].map((f, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ 
              background: "rgba(10, 10, 12, 0.6)", 
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)"
            }}>
              <div style={{
                  width: 48, height: 48, borderRadius: "12px",
                  background: "transparent",
                  border: "1px solid rgba(240, 185, 11, 0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)", marginBottom: "2rem",
                  boxShadow: "inset 0 0 10px rgba(240, 185, 11, 0.04), 0 0 10px rgba(240, 185, 11, 0.04)"
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", fontFamily: "Outfit", color: "var(--text-primary)" }}>{f.title}</h3>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how" style={{ position: "relative", zIndex: 1, padding: "6rem 2rem", background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "5rem" }}>
            <h2 className="section-title">How it works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem" }}>
            {[
              { step: "01", icon: <Wallet />, title: "Connect Wallet", desc: "Link Phantom or Solflare to authenticate seamlessly." },
              { step: "02", icon: <Search />, title: "Find Plan", desc: "Choose a merchant subscription that fits your needs." },
              { step: "03", icon: <ArrowDownToLine />, title: "Deposit USDC", desc: "Fund your subscription with a single on-chain transaction." },
              { step: "04", icon: <Sparkles />, title: "Earn Yield", desc: "Yield covers your fees automatically." },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ position: "relative" }}>
                <div style={{ fontSize: "3rem", fontWeight: 800, color: "rgba(255, 255, 255, 0.03)", position: "absolute", top: -20, left: -10, zIndex: 0, fontFamily: "Outfit" }}>
                  {s.step}
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                    {s.icon}
                  </div>
                  <h4 style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.75rem", fontFamily: "Outfit" }}>{s.title}</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ position: "relative", zIndex: 1, padding: "8rem 2rem", maxWidth: 760, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p className="section-label" style={{ marginBottom: "1rem" }}>Knowledge Base</p>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {faqs.map((faq, i) => {
            const isActive = activeFaq === i;
            return (
              <div key={i} className={`panel reveal reveal-delay-${i + 1}`} style={{ padding: 0, cursor: "pointer", overflow: "hidden", borderColor: isActive ? "var(--border-active)" : "var(--glass-border)", transition: "all 0.3s" }} onClick={() => setActiveFaq(isActive ? null : i)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "1rem", color: isActive ? "var(--accent)" : "var(--text-primary)", transition: "color 0.3s" }}>{faq.q}</span>
                  <div style={{ transform: isActive ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)", color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                    <ChevronDown size={20} />
                  </div>
                </div>
                <div style={{
                    maxHeight: isActive ? 200 : 0, 
                    opacity: isActive ? 1 : 0,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    padding: isActive ? "0 1.5rem 1.5rem" : "0 1.5rem 0",
                    fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)"
                  }}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "4rem 2rem 8rem", maxWidth: 720, margin: "0 auto" }}>
        <div className="gradient-border-card reveal" style={{ textAlign: "center", padding: "4rem 3rem", background: "rgba(10, 10, 12, 0.8)", backdropFilter: "blur(40px)" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem", fontFamily: "Outfit", color: "var(--text-primary)" }}>Ready for Yield?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Connect your wallet and experience the future of on-chain automated settlements.
          </p>
          <div style={{ display: "inline-flex", position: "relative" }}>
            <div style={{ position: "absolute", inset: -15, background: "var(--glow-gold)", filter: "blur(25px)", borderRadius: "50%", zIndex: -1 }}></div>
            <WalletMultiButton className="connect-btn" startIcon={<Wallet size={18} />} style={{ transform: "scale(1.05)" }} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: "relative", zIndex: 1, padding: "3rem 2.5rem", borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Hexagon size={24} fill="rgba(240, 185, 11, 0.2)" color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: "1rem", fontFamily: "Outfit" }}>Yield Subscriptions</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {[<MessageCircle size={18} key="tw" />, <Terminal size={18} key="gh" />, <Globe size={18} key="gl" />].map((icon, i) => (
              <a key={i} href="#" style={{ color: "var(--text-muted)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                {icon}
              </a>
            ))}
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
            © 2026 Yield Subscriptions
          </span>
        </div>
      </footer>
    </div>
  );
}
