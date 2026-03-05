import { useState } from "react";
import { getPlugins } from "../plugins/registry";
import type { Plugin, PluginConfig } from "../plugins/types";

export function PluginsPage() {
  const plugins = getPlugins();
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);
  const [showSettings, setShowSettings] = useState<Plugin | null>(null);

  if (activePlugin) {
    const PanelComponent = activePlugin.component;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 backdrop-blur-md bg-white/5">
          <button
            onClick={() => setActivePlugin(null)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Plugins
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white font-medium">{activePlugin.name}</span>
        </div>
        <div className="flex-1 max-w-2xl w-full mx-auto">
          <PanelComponent onClose={() => setActivePlugin(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            WatchParty
          </a>
          <div className="flex gap-6">
            <a href="/" className="text-white/80 hover:text-white transition-colors text-sm">Home</a>
            <a href="/discover" className="text-white/80 hover:text-white transition-colors text-sm">Discover</a>
            <a href="/create" className="text-white/80 hover:text-white transition-colors text-sm">Create Party</a>
            <a href="/plugins" className="text-white font-semibold transition-colors text-sm">Plugins</a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Plugins</h1>
          <p className="text-white/50 text-lg">
            Extend your watch party experience with integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onOpen={() => setActivePlugin(plugin)}
              onConfigure={() => setShowSettings(plugin)}
            />
          ))}
        </div>

        {plugins.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16 8L2 22M17.5 15H9" />
            </svg>
            <p>No plugins installed</p>
          </div>
        )}
      </main>

      {showSettings && (
        <showSettings.settingsComponent
          onSave={(_config: PluginConfig) => setShowSettings(null)}
          onCancel={() => setShowSettings(null)}
        />
      )}
    </div>
  );
}

function PluginCard({
  plugin,
  onOpen,
  onConfigure,
}: {
  plugin: Plugin;
  onOpen: () => void;
  onConfigure: () => void;
}) {
  const configured = plugin.isConfigured();

  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 flex items-center justify-center flex-shrink-0">
          <LinearLogoMedium />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{plugin.name}</h3>
            <span className="text-xs text-white/30">v{plugin.version}</span>
            {configured && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 leading-relaxed">{plugin.description}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {configured ? (
          <button
            onClick={onOpen}
            className="flex-1 py-2 rounded-xl bg-[#5e6ad2] hover:bg-[#6b78e5] text-white text-sm font-medium transition-colors"
          >
            Open
          </button>
        ) : (
          <button
            onClick={onConfigure}
            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors border border-white/10"
          >
            Connect
          </button>
        )}
        {configured && (
          <button
            onClick={onConfigure}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-sm transition-colors border border-white/10"
            title="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function LinearLogoMedium() {
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.22541 61.5228C0.14298 59.0595 0.727634 56.7297 1.81006 54.9301L25.6391 78.7591C23.8395 79.8415 21.5097 80.4261 19.0464 79.3437L1.22541 61.5228Z" fill="#5E6AD2" />
      <path d="M9.15723 72.9222L27.0781 90.8431C28.6405 92.4055 30.5784 92.9489 32.4247 92.9489L7.07173 67.5959C7.07173 69.4422 7.61519 71.3801 9.15723 72.9222Z" fill="#5E6AD2" />
      <path d="M14.8712 78.6361L21.3641 85.1291L64.0435 41.8577C67.7949 38.1062 68.587 32.3872 65.7 28.0364L14.8712 78.6361Z" fill="#5E6AD2" />
      <path d="M28.6898 92.4558L35.1827 98.9488C39.5336 96.0618 43.8844 91.711 47.6358 87.9594L100 35.5953C96.213 40.334 92.8633 44.8966 90.1686 50.4228L71.7534 31.0763C77.2795 28.3816 81.8421 25.0319 86.5809 21.2449L34.2168 73.6091C30.4654 77.3605 26.8062 81.6803 23.9192 86.0312C25.5728 88.1677 27.2264 90.4143 28.6898 92.4558Z" fill="#5E6AD2" />
      <path d="M44.6108 8.29285C49.3496 4.50588 53.9122 1.15614 58.6509 -1.53863e-05L6.28691 52.3641C5.13566 57.1028 3.78644 61.6654 0 66.4041L52.3641 14.04C47.6253 11.1529 41.9063 9.94547 44.6108 8.29285Z" fill="#5E6AD2" />
    </svg>
  );
}
