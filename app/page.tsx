import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white selection:bg-indigo-500/30" style={{
      background: '#101022',
      fontFamily: 'var(--font-display), var(--font-inter), system-ui, sans-serif',
    }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-indigo-500/10 backdrop-blur-md" style={{ background: 'rgba(16, 16, 34, 0.8)' }}>
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-20">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="ResolvOS" className="h-8 w-8 rounded object-contain" />
              <span className="text-xl font-bold tracking-tight text-white">ResolvOS</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/agent/login" className="text-sm font-medium text-slate-400 hover:text-white transition px-4 py-2 rounded-lg hover:bg-white/5">
              Agent Login
            </Link>
            <Link href="/chat" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2.5 transition shadow-lg shadow-indigo-900/40">
              Try Live Demo
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center px-6 pt-12 pb-20 overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/8 blur-[180px]" />
          <div className="absolute bottom-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left — copy */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Autonomous Operations Engine</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-[3.8rem] font-bold tracking-tight leading-[1.1] text-white">
                Stop Losing Hours<br />
                <span className="text-indigo-400/80">to Refund Requests</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                ResolvOS validates refund requests, detects fraud, and resolves 60%+ of cases instantly — without a single support ticket hitting your inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/chat" className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-8 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-900/30">
                Try Live Demo
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-semibold text-slate-300 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                View Agent Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2">
              {['Auto-validates', 'Auto-resolves', 'Fraud detection', 'Full audit trail'].map((tag, i) => (
                <span key={tag} className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-700" />}
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-8 rounded-3xl bg-indigo-600/8 blur-[60px]" />
              <div className="absolute -inset-4 rounded-3xl bg-violet-500/5 blur-[40px]" />
              <img
                src="/hero-agent.png"
                alt="Customer service agent using ResolvOS automated refund processing platform"
                className="relative w-full h-auto rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-indigo-500/10 py-1" style={{ background: 'rgba(43, 43, 238, 0.03)' }}>
        <div className="mx-auto max-w-5xl grid grid-cols-3">
          {[
            { label: 'Support workload reduction', value: '~60%', color: 'text-emerald-400' },
            { label: 'Auto-resolved in under', value: '< 2s', color: 'text-indigo-400' },
            { label: 'Human review accuracy', value: '100%', color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={s.label} className={`px-8 py-10 text-center space-y-2 ${i > 0 ? 'border-l border-indigo-500/10' : ''}`}>
              <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 rounded-full px-4 py-1.5">How It Works</span>
            <h2 className="text-3xl font-bold text-white">From request to resolution in seconds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(43, 43, 238, 0.3), transparent)' }} />
            {[
              { step: '01', icon: '💬', title: 'Customer Submits', desc: 'Customer explains their issue naturally via chat. No forms, no ticket numbers.' },
              { step: '02', icon: '🔍', title: 'AI Validates', desc: 'Fetches order data, verifies ownership, and evaluates return eligibility in real time.' },
              { step: '03', icon: '⚡', title: 'Auto-Resolve or Escalate', desc: 'Low-risk refunds approved instantly. Complex cases escalate with a full AI summary.' },
              { step: '04', icon: '📊', title: 'Full Control', desc: 'Every decision is logged. Agents review flagged tickets with one-click approve or reject.' },
            ].map(item => (
              <div key={item.step} className="group relative rounded-xl p-6 space-y-5 transition-all duration-300 hover:bg-white/[0.02]" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute -top-3 left-5 rounded-full bg-[#101022] border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 font-mono tracking-widest">{item.step}</div>
                <div className="text-3xl">{item.icon}</div>
                <h3 className="font-bold text-white text-sm tracking-wide">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section id="features" className="py-28 px-6 border-t border-indigo-500/10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 rounded-full px-4 py-1.5">Core Capabilities</span>
            <h2 className="text-3xl font-bold text-white">Everything you need to scale support</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Autonomous Refund Validation',
                desc: 'The AI dynamically infers return policies per product category and validates each claim against live order data.',
                icon: '⚡', accent: 'from-indigo-500/10 to-transparent', border: 'border-indigo-500/15',
              },
              {
                title: 'Fraud Detection',
                desc: 'Automatically flags customers with abnormal refund patterns. Fraud scores and frequency analysis built in.',
                icon: '🚨', accent: 'from-amber-500/10 to-transparent', border: 'border-amber-500/15',
              },
              {
                title: 'Human-in-the-Loop Control',
                desc: 'High-value or complex cases auto-escalate with full AI summaries. Agents approve or reject in one click.',
                icon: '🛡️', accent: 'from-violet-500/10 to-transparent', border: 'border-violet-500/15',
              },
              {
                title: 'Configurable Policy Engine',
                desc: 'Set auto-approval thresholds, refund windows, and category rules from a live dashboard. No code changes.',
                icon: '⚙️', accent: 'from-cyan-500/10 to-transparent', border: 'border-cyan-500/15',
              },
              {
                title: 'Full Audit Trail',
                desc: 'Every AI decision is logged with full rationale. Searchable history, timestamps, and agent actions.',
                icon: '📋', accent: 'from-slate-500/10 to-transparent', border: 'border-slate-500/15',
              },
              {
                title: 'Shopify Integration Ready',
                desc: 'Plugs directly into your Shopify store via REST/GraphQL APIs. Retrieves live orders and triggers refunds securely.',
                icon: '🛍️', accent: 'from-rose-500/10 to-transparent', border: 'border-rose-500/15',
              },
            ].map(f => (
              <div key={f.title} className={`group relative rounded-xl ${f.border} p-6 space-y-5 transition-all duration-300 overflow-hidden cursor-default`} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className={`absolute inset-0 bg-gradient-to-b ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="mt-4 font-bold text-white text-sm tracking-wide">{f.title}</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 border-t border-indigo-500/10">
        <div className="mx-auto max-w-2xl text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">See it work in <span className="text-indigo-400">real time</span></h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">Submit a refund request as a customer and watch the AI validate, decide, and log the ticket — automatically.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-8 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-900/40">
              Customer Demo →
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-sm font-semibold text-slate-300 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Agent Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-indigo-500/10 py-20" style={{ background: 'rgba(16, 16, 34, 0.5)' }}>
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="ResolvOS" className="h-6 w-6 rounded-sm object-contain" />
              <span className="text-lg font-bold tracking-tight text-white uppercase">ResolvOS</span>
            </div>
            <p className="text-sm text-slate-500">Intelligent resolution platform. Redefining how e-commerce handles customer operations.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link className="hover:text-indigo-400 transition-colors" href="/chat">Customer Chat</Link></li>
              <li><Link className="hover:text-indigo-400 transition-colors" href="/dashboard">Agent Dashboard</Link></li>
              <li><Link className="hover:text-indigo-400 transition-colors" href="/agent/login">Agent Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm">Capabilities</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>AI Refund Validation</li>
              <li>Fraud Monitoring</li>
              <li>Policy Configuration</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm">System Status</h4>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-400">All Systems Online</span>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 mt-20 pt-8 border-t border-indigo-500/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 uppercase tracking-[0.15em]">
          <span>© 2025 ResolvOS · Autonomous Customer Operations</span>
          <div className="flex gap-8">
            <span>All decisions logged</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
