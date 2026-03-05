import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { PluginsPage } from "./pages/PluginsPage";

/* ─── Motion variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

/* ─── Aurora background ─── */
function Aurora() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="aurora-blob aurora-1 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(124,58,237,0.45),transparent_70%)] -top-40 -left-32" />
      <div className="aurora-blob aurora-2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(236,72,153,0.35),transparent_70%)] -top-48 -right-40" />
      <div className="aurora-blob aurora-3 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.28),transparent_70%)] bottom-10 left-1/3" />
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  const location = useLocation();
  const links = [
    { to: "/", label: "Home" },
    { to: "/discover", label: "Discover" },
    { to: "/create", label: "Create Party" },
    { to: "/plugins", label: "Plugins" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-2xl"
      style={{ background: "rgba(5,5,17,0.72)" }}>
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gradient-static">WatchParty</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {links.map((link) => (
            <Link key={link.to} to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? "text-white bg-white/[0.09] shadow-inner"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="/create"
          className="btn-primary px-4 py-2 rounded-xl text-sm">
          + Create Party
        </Link>
      </div>
    </nav>
  );
}

/* ─── Services list ─── */
const SERVICES = ["Netflix", "YouTube", "Spotify", "Twitch", "Prime", "Disney+", "HBO", "Apple TV+", "Hulu", "Paramount+"];

/* ─── Home Page ─── */
function HomePage() {
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      ),
      gradient: "from-violet-500 to-purple-600",
      glow: "rgba(139,92,246,0.35)",
      title: "10 Streaming Services",
      desc: "Netflix, YouTube, Spotify, Twitch, Prime Video, and more — all in one place.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-600",
      glow: "rgba(236,72,153,0.35)",
      title: "Real-time Sync",
      desc: "Everyone watches in perfect sync. Play, pause, and seek together seamlessly.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" />
        </svg>
      ),
      gradient: "from-cyan-500 to-blue-600",
      glow: "rgba(6,182,212,0.35)",
      title: "Plugin Ecosystem",
      desc: "Extend with Linear, Jira, Notion, and more. Supercharge every session.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      gradient: "from-amber-500 to-orange-600",
      glow: "rgba(245,158,11,0.35)",
      title: "Voice & Chat",
      desc: "Built-in live chat and voice chat so you never miss a reaction.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Parties created" },
    { value: "50K+", label: "Hours watched" },
    { value: "100K+", label: "Users worldwide" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="relative min-h-screen text-white">
      <Aurora />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-new text-xs font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Now with Linear plugin support
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-7xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8">
            <span className="text-gradient">Watch Together,</span>
            <br />
            <span className="text-white/90">Stay Connected.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-xl text-white/50 max-w-xl mx-auto mb-12 leading-relaxed">
            Create private watch parties with your team. Real-time sync, integrated tools,
            and zero friction.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex justify-center gap-4 flex-wrap">
            <Link to="/create"
              className="btn-primary px-7 py-3.5 rounded-2xl text-base">
              Create a Party
            </Link>
            <Link to="/discover"
              className="btn-ghost px-7 py-3.5 rounded-2xl text-base">
              Browse Parties
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating hero card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 mx-auto max-w-2xl animate-float"
        >
          <div className="glass gradient-border rounded-3xl p-1.5 shadow-2xl shadow-purple-900/40">
            <div className="rounded-[20px] overflow-hidden bg-[#0d0d1f]">
              {/* Fake video player UI */}
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-[#0a0a1f] relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-all hover:scale-105">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                {/* Title overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white/70 font-medium">LIVE · 4 watching</span>
                </div>
                {/* Chat preview */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 items-end">
                  {["Amazing scene! 🎬", "So good omg", "pause pls 😂"].map((m, i) => (
                    <div key={i} className="glass px-3 py-1.5 rounded-full text-xs text-white/80">
                      {m}
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full w-[42%] bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/[0.06]" style={{ background: "rgba(255,255,255,0.018)" }}>
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="text-3xl font-black text-gradient-static mb-1">{s.value}</p>
              <p className="text-sm text-white/40">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Everything you need</p>
          <h2 className="text-5xl font-black text-white mb-4">Built for teams who care.</h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Every feature designed to make watching together effortless and memorable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="glass glass-hover rounded-2xl p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 text-white transition-transform duration-300 group-hover:scale-110`}
                style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services marquee */}
      <section className="relative z-10 py-16 overflow-hidden border-y border-white/[0.06]" style={{ background: "rgba(255,255,255,0.018)" }}>
        <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-widest mb-10">
          Works with all your favorites
        </p>
        <div className="flex gap-6 flex-wrap justify-center px-8">
          {SERVICES.map((s) => (
            <span key={s}
              className="px-5 py-2 rounded-full glass text-sm font-medium text-white/50 hover:text-white/80 hover:border-white/20 border border-white/[0.07] transition-all cursor-default">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Plugin CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass gradient-border rounded-3xl p-12"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(94,106,210,0.15)] border border-[rgba(94,106,210,0.3)] flex items-center justify-center mb-6 animate-glow">
            <LinearLogoIcon size={32} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Connect with <span className="text-gradient-linear">Linear</span>
          </h2>
          <p className="text-white/45 text-lg max-w-md mx-auto mb-8">
            Create issues, view your sprint, and track tasks — all without leaving your watch party.
          </p>
          <Link to="/plugins"
            className="btn-linear inline-block px-8 py-3.5 rounded-2xl text-base">
            Explore Plugins →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-gradient-static font-bold">WatchParty</span>
          <p className="text-xs text-white/25">© 2026 WatchParty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Discover Page ─── */
function DiscoverPage() {
  const parties = [
    { id: 1, title: "Movie Night: Inception", host: "Alex", viewers: 5, service: "Netflix", color: "from-red-500 to-rose-600" },
    { id: 2, title: "Chillwave Music Session", host: "Jordan", viewers: 3, service: "Spotify", color: "from-green-500 to-emerald-600" },
    { id: 3, title: "Gaming: Elden Ring", host: "Sam", viewers: 12, service: "Twitch", color: "from-violet-500 to-purple-600" },
    { id: 4, title: "Documentary Sunday", host: "Taylor", viewers: 7, service: "YouTube", color: "from-red-500 to-orange-600" },
    { id: 5, title: "Weekly Team Sync", host: "Morgan", viewers: 9, service: "Disney+", color: "from-blue-500 to-indigo-600" },
    { id: 6, title: "Horror Night 🎃", host: "Casey", viewers: 4, service: "HBO", color: "from-slate-500 to-gray-600" },
  ];

  return (
    <div className="relative min-h-screen text-white">
      <Aurora />
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-5xl font-black mb-2">Discover Parties</h1>
          <p className="text-white/40 mb-10">Join an active watch party right now.</p>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {parties.map((p, i) => (
            <motion.div key={p.id} variants={fadeUp} custom={i}
              className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer">
              <div className={`h-2 bg-gradient-to-r ${p.color}`} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${p.color} text-white`}>
                    {p.service}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {p.viewers} live
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{p.title}</h3>
                <p className="text-sm text-white/45">Hosted by {p.host}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Create Party Page ─── */
function CreatePartyPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="relative min-h-screen text-white">
      <Aurora />
      <Navbar />
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
                  s < step ? "bg-violet-500 border-violet-500 text-white"
                    : s === step ? "border-violet-500 text-violet-400"
                      : "border-white/10 text-white/25"
                }`}>
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && <div className={`h-px w-12 ${s < step ? "bg-violet-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-5xl font-black mb-2">
            {step === 1 ? "Name your party" : step === 2 ? "Pick a service" : "Launch 🚀"}
          </h1>
          <p className="text-white/40 mb-10">Step {step} of 3</p>

          <div className="glass gradient-border rounded-3xl p-8">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Party Name</label>
                  <input type="text" placeholder="Movie Night with Friends"
                    className="input-glass w-full px-4 py-3.5 rounded-xl text-base" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Description</label>
                  <textarea rows={3} placeholder="What are we watching tonight?"
                    className="input-glass w-full px-4 py-3.5 rounded-xl text-base resize-none" />
                </div>
                <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5 rounded-xl text-base">
                  Continue →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-3">Streaming Service</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Netflix", "YouTube", "Spotify", "Twitch", "Prime Video", "Disney+"].map((s) => (
                      <button key={s}
                        className="btn-ghost py-3 px-4 rounded-xl text-sm font-medium text-left hover:border-violet-500/40">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3.5 rounded-xl">← Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3.5 rounded-xl">Continue →</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-purple-500/40">
                  🎉
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">You're all set!</h3>
                  <p className="text-white/45">Your party code will be generated instantly.</p>
                </div>
                <button
                  onClick={() => alert("Party created! Code: XKCD-42")}
                  className="btn-primary w-full py-3.5 rounded-xl text-base"
                >
                  Launch Party 🚀
                </button>
                <button onClick={() => setStep(2)} className="btn-ghost w-full py-3 rounded-xl text-sm">← Back</button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Linear logo icon ─── */
export function LinearLogoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.22541 61.5228C0.14298 59.0595 0.727634 56.7297 1.81006 54.9301L25.6391 78.7591C23.8395 79.8415 21.5097 80.4261 19.0464 79.3437L1.22541 61.5228Z" fill="#5E6AD2" />
      <path d="M9.15723 72.9222L27.0781 90.8431C28.6405 92.4055 30.5784 92.9489 32.4247 92.9489L7.07173 67.5959C7.07173 69.4422 7.61519 71.3801 9.15723 72.9222Z" fill="#5E6AD2" />
      <path d="M14.8712 78.6361L21.3641 85.1291L64.0435 41.8577C67.7949 38.1062 68.587 32.3872 65.7 28.0364L14.8712 78.6361Z" fill="#5E6AD2" />
      <path d="M28.6898 92.4558L35.1827 98.9488C39.5336 96.0618 43.8844 91.711 47.6358 87.9594L100 35.5953C96.213 40.334 92.8633 44.8966 90.1686 50.4228L71.7534 31.0763C77.2795 28.3816 81.8421 25.0319 86.5809 21.2449L34.2168 73.6091C30.4654 77.3605 26.8062 81.6803 23.9192 86.0312C25.5728 88.1677 27.2264 90.4143 28.6898 92.4558Z" fill="#5E6AD2" />
      <path d="M44.6108 8.29285C49.3496 4.50588 53.9122 1.15614 58.6509 -1.53863e-05L6.28691 52.3641C5.13566 57.1028 3.78644 61.6654 0 66.4041L52.3641 14.04C47.6253 11.1529 41.9063 9.94547 44.6108 8.29285Z" fill="#5E6AD2" />
    </svg>
  );
}

/* ─── Router ─── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/create" element={<CreatePartyPage />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/plugins/:pluginId" element={<PluginsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
