import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getPlugins } from "../plugins/registry";
import type { Plugin, PluginConfig } from "../plugins/types";
import { LinearLogoIcon } from "../App";

const COMING_SOON = [
  { name: "Jira", desc: "Sync sprint issues with your sessions.", color: "from-blue-500 to-blue-700", icon: "🔷" },
  { name: "Notion", desc: "Take meeting notes without leaving.", color: "from-slate-400 to-slate-600", icon: "📓" },
  { name: "GitHub", desc: "View PRs and issues from your party.", color: "from-slate-500 to-slate-700", icon: "🐙" },
  { name: "Slack", desc: "Auto-post recaps to your channels.", color: "from-green-500 to-emerald-600", icon: "💬" },
];

function Aurora() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="aurora-blob aurora-1 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(94,106,210,0.3),transparent_70%)] -top-40 -left-32" />
      <div className="aurora-blob aurora-2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_70%)] top-20 right-0" />
    </div>
  );
}

export function PluginsPage() {
  const plugins = getPlugins();
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);
  const [showSettings, setShowSettings] = useState<Plugin | null>(null);

  if (activePlugin) {
    const PanelComponent = activePlugin.component;
    return (
      <div className="relative min-h-screen bg-[#050511] text-white">
        <Aurora />
        {/* Panel header */}
        <div className="relative z-10 sticky top-0 border-b border-white/[0.07] backdrop-blur-2xl"
          style={{ background: "rgba(5,5,17,0.8)" }}>
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => setActivePlugin(null)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Plugins
            </button>
            <span className="text-white/20">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[rgba(94,106,210,0.15)] border border-[rgba(94,106,210,0.25)] flex items-center justify-center">
                <LinearLogoIcon size={14} />
              </div>
              <span className="text-white font-semibold text-sm">{activePlugin.name}</span>
              {activePlugin.isConfigured() && (
                <span className="badge-connected px-2 py-0.5 rounded-full text-xs font-semibold">Connected</span>
              )}
            </div>
          </div>
        </div>
        {/* Plugin panel content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <PanelComponent onClose={() => setActivePlugin(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050511] text-white">
      <Aurora />

      {/* Navbar */}
      <nav className="relative z-10 sticky top-0 border-b border-white/[0.06] backdrop-blur-2xl"
        style={{ background: "rgba(5,5,17,0.72)" }}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gradient-static">WatchParty</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {[{ to: "/", label: "Home" }, { to: "/discover", label: "Discover" }, { to: "/create", label: "Create Party" }, { to: "/plugins", label: "Plugins" }]
              .map((link) => (
                <Link key={link.to} to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    link.to === "/plugins" ? "text-white bg-white/[0.09]" : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                  }`}>
                  {link.label}
                </Link>
              ))}
          </div>
          <Link to="/create" className="btn-primary px-4 py-2 rounded-xl text-sm">+ Create Party</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          className="mb-14">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Integrations</p>
          <h1 className="text-6xl font-black text-white mb-3">Plugins</h1>
          <p className="text-white/40 text-xl">Supercharge your watch parties with your favourite tools.</p>
        </motion.div>

        {/* Installed plugins */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }} className="mb-16">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">Available</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin, i) => (
              <PluginCard key={plugin.id} plugin={plugin} index={i}
                onOpen={() => setActivePlugin(plugin)}
                onConfigure={() => setShowSettings(plugin)} />
            ))}
          </div>
        </motion.div>

        {/* Coming soon */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMING_SOON.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.5 }}
                className="glass rounded-2xl p-5 opacity-50 cursor-not-allowed">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl flex-shrink-0 opacity-60`}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white/70">{p.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/8 border border-white/10 text-white/40">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-sm text-white/30">{p.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <showSettings.settingsComponent
            onSave={(_config: PluginConfig) => setShowSettings(null)}
            onCancel={() => setShowSettings(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PluginCard({ plugin, index, onOpen, onConfigure }: {
  plugin: Plugin;
  index: number;
  onOpen: () => void;
  onConfigure: () => void;
}) {
  const configured = plugin.isConfigured();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass glass-hover rounded-2xl p-6 group relative overflow-hidden"
    >
      {/* Subtle gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(94,106,210,0.5)] to-transparent" />

      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(94,106,210,0.1)] border border-[rgba(94,106,210,0.2)] flex items-center justify-center
            group-hover:border-[rgba(94,106,210,0.4)] transition-all duration-300">
            <LinearLogoIcon size={28} />
          </div>
          {configured && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#050511] animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg">{plugin.name}</h3>
            <span className="text-xs text-white/25 font-mono">v{plugin.version}</span>
            {configured && (
              <span className="badge-connected px-2.5 py-0.5 rounded-full text-xs font-semibold">Connected</span>
            )}
          </div>
          <p className="text-sm text-white/45 leading-relaxed mb-4">{plugin.description}</p>

          {/* Capabilities */}
          <ul className="space-y-1.5 mb-5">
            {["View assigned issues", "Create issues from a party", "Link issues to sessions"].map((cap) => (
              <li key={cap} className="flex items-center gap-2 text-xs text-white/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#5e6ad2] flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {cap}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex gap-2">
            {configured ? (
              <>
                <button onClick={onOpen} className="btn-linear flex-1 py-2.5 rounded-xl text-sm">
                  Open Plugin
                </button>
                <button onClick={onConfigure}
                  className="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  title="Settings">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </>
            ) : (
              <button onClick={onConfigure} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm border-[rgba(94,106,210,0.3)] hover:border-[rgba(94,106,210,0.5)] hover:text-[#7b84e3]">
                Connect Linear →
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
