import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import backgroundImage from "../public/background.jpg";

// SVG Icons
const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 8v7c0 7.18 5.12 13.9 12 15.5 6.88-1.6 12-8.32 12-15.5V8L16 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 16l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3L5 17h8l-2 12 12-14h-8l2-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CoinsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 12h8M12 16h8M12 20h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = ({ expanded, className = "w-5 h-5" }: { expanded: boolean; className?: string }) => (
  <svg 
    className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface LandingPageProps {
  onConnected: () => void;
}

export function LandingPage({ onConnected }: LandingPageProps) {
  const wallet = useAnchorWallet();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (wallet) {
    onConnected();
    return null;
  }

  const faqs = [
    {
      q: "How does Yield Subscriptions work?",
      a: "Merchants create subscription plans with custom pricing and periods. Users deposit USDC and earn yield while their subscription is active. Settlements happen automatically each period."
    },
    {
      q: "Is my deposit safe?",
      a: "Yes! Funds are held in secure program vaults on Solana blockchain. The protocol uses audited smart contracts with no admin keys."
    },
    {
      q: "What are the fees?",
      a: "A small protocol fee is taken from each settlement. The exact fee is displayed before you subscribe to any plan."
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes, you can cancel anytime. Your remaining principal will be returned to your wallet minus any accrued fees."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm">YS</div>
          <span className="font-semibold text-lg text-neutral-900">Yield Subscriptions</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-violet-600 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-violet-600 transition-colors">How it works</a>
          <a href="#faq" className="text-sm font-medium text-neutral-600 hover:text-violet-600 transition-colors">FAQ</a>
        </div>
        <WalletMultiButton className="!bg-neutral-900 !text-white !rounded-lg !px-4 !py-2.5 !text-sm !font-medium hover:!bg-neutral-800 transition-colors" />
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={backgroundImage} alt="Background" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 flex items-center justify-between gap-12">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Web3 Yield Protocol</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Unlock the true{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">investment potential</span>{" "}
              of your USDC
            </h1>

            {/* Description */}
            <p className="text-lg text-white/80 mb-8 max-w-md leading-relaxed">
              Subscribe to merchant plans and earn yield on your deposits. Automated settlements, secure vaults, real returns.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-12">
              <WalletMultiButton className="!bg-white !text-neutral-900 !rounded-xl !px-6 !py-3 !font-semibold hover:!bg-neutral-100 transition-all shadow-xl" />
              <a href="#features" className="text-white/80 hover:text-white font-medium transition-colors">Learn more</a>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-white">$2.4M+</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Total Value Locked</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white">12.5%</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Average APY</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white">1,240+</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Active Users</div>
              </div>
            </div>
          </div>

          {/* Visual Cards */}
          <div className="hidden lg:block relative w-[400px] h-[450px]">
            {/* Main Card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs text-white/60 uppercase tracking-wider">Yield Earned</span>
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">+24.8%</div>
              <div className="text-sm text-white/50 mb-6">This month</div>
              <div className="flex items-end gap-1.5 h-14">
                <div className="flex-1 bg-white/20 rounded-sm h-[30%]" />
                <div className="flex-1 bg-white/20 rounded-sm h-[50%]" />
                <div className="flex-1 bg-white/20 rounded-sm h-[40%]" />
                <div className="flex-1 bg-white/20 rounded-sm h-[70%]" />
                <div className="flex-1 bg-gradient-to-t from-amber-400 to-orange-400 rounded-sm h-[90%]" />
              </div>
            </div>

            {/* Floating Card 1 */}
            <div className="absolute top-[5%] right-0 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <CoinsIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Current APY</div>
                <div className="text-base font-semibold text-white">14.2%</div>
              </div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute bottom-[15%] -left-8 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <ShieldIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Your Deposit</div>
                <div className="text-base font-semibold text-white">5,000 USDC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Bar */}
      <section className="bg-neutral-900 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-center gap-12 flex-wrap">
          {['Solana', 'USDC', 'Anchor', 'Devnet', 'Web3'].map((partner) => (
            <span key={partner} className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              {partner}
            </span>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">Empower your assets</h2>
            <p className="text-lg text-neutral-500">to reach their full potential</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldIcon, title: "Secure Vaults", desc: "Program-controlled vaults ensure your deposits are safe with audited smart contracts." },
              { icon: ZapIcon, title: "Auto Settlements", desc: "Settlements happen automatically each period. No manual intervention needed." },
              { icon: CoinsIcon, title: "Earn Yield", desc: "Deposit USDC and earn yield while maintaining subscription access to services." }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-neutral-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Connect Wallet", desc: "Link your Phantom or Solflare wallet to get started" },
              { step: "2", title: "Choose Plan", desc: "Browse available merchant subscription plans" },
              { step: "3", title: "Deposit USDC", desc: "Fund your subscription with USDC deposits" },
              { step: "4", title: "Earn Yield", desc: "Automatic settlements credit yield to merchants" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-violet-600 flex items-center justify-center text-violet-600 font-semibold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Frequently asked questions</p>
            <h2 className="text-3xl font-bold text-neutral-900">What you need to know</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden cursor-pointer hover:border-violet-200 transition-colors"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-5">
                  <span className="font-medium text-neutral-900">{faq.q}</span>
                  <ChevronIcon expanded={activeFaq === i} className="w-5 h-5 text-violet-600 flex-shrink-0" />
                </div>
                {activeFaq === i && (
                  <div className="px-5 pb-5 text-neutral-500 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-3xl p-10 md:p-12 text-center shadow-xl shadow-violet-100">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">Ready to start earning?</h2>
            <p className="text-neutral-500 mb-8">Connect your wallet and explore subscription plans from merchants.</p>
            <WalletMultiButton className="!bg-violet-600 !text-white !rounded-xl !px-8 !py-4 !font-semibold hover:!bg-violet-700 transition-colors shadow-lg shadow-violet-200" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center font-bold text-sm">YS</div>
              <span className="font-semibold text-lg">Yield Subscriptions</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-neutral-400 hover:text-white transition-colors">How it works</a>
              <a href="#faq" className="text-sm text-neutral-400 hover:text-white transition-colors">FAQ</a>
            </div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">Built on Solana</span>
          </div>
          <div className="pt-8 text-center text-xs text-neutral-500">
            © 2026 Yield Subscriptions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
