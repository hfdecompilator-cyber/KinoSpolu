import { useState } from "react";
import { useLinearAuth } from "./useLinear";
import type { PluginSettingsProps } from "../types";

export function LinearSettingsModal({ onSave, onCancel }: PluginSettingsProps) {
  const { verifying, error, verifyAndSave } = useLinearAuth();
  const [keyInput, setKeyInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyAndSave(keyInput.trim());
    if (ok) onSave({ apiKey: keyInput.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#5e6ad2]/20 flex items-center justify-center">
            <LinearLogo />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Connect Linear</h2>
            <p className="text-sm text-white/50">Enter your Personal API key to connect</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Personal API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="lin_api_••••••••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-transparent transition-all"
              required
            />
            <p className="mt-2 text-xs text-white/40">
              Get your API key from{" "}
              <a
                href="https://linear.app/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5e6ad2] hover:text-[#7b84e3] underline"
              >
                linear.app/settings/api
              </a>
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || !keyInput.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-[#5e6ad2] hover:bg-[#6b78e5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {verifying ? "Verifying..." : "Connect"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            What this plugin does
          </h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-[#5e6ad2] mt-0.5">✓</span>
              View your assigned Linear issues
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#5e6ad2] mt-0.5">✓</span>
              Create issues directly from a watch party
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#5e6ad2] mt-0.5">✓</span>
              Link issues to your current session
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LinearLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.22541 61.5228C0.14298 59.0595 0.727634 56.7297 1.81006 54.9301L25.6391 78.7591C23.8395 79.8415 21.5097 80.4261 19.0464 79.3437L1.22541 61.5228Z"
        fill="#5E6AD2"
      />
      <path
        d="M9.15723 72.9222L27.0781 90.8431C28.6405 92.4055 30.5784 92.9489 32.4247 92.9489L7.07173 67.5959C7.07173 69.4422 7.61519 71.3801 9.15723 72.9222Z"
        fill="#5E6AD2"
      />
      <path
        d="M14.8712 78.6361L21.3641 85.1291L64.0435 41.8577C67.7949 38.1062 68.587 32.3872 65.7 28.0364L14.8712 78.6361Z"
        fill="#5E6AD2"
      />
      <path
        d="M28.6898 92.4558L35.1827 98.9488C39.5336 96.0618 43.8844 91.711 47.6358 87.9594L100 35.5953C96.213 40.334 92.8633 44.8966 90.1686 50.4228L71.7534 31.0763C77.2795 28.3816 81.8421 25.0319 86.5809 21.2449L34.2168 73.6091C30.4654 77.3605 26.8062 81.6803 23.9192 86.0312C25.5728 88.1677 27.2264 90.4143 28.6898 92.4558Z"
        fill="#5E6AD2"
      />
      <path
        d="M44.6108 8.29285C49.3496 4.50588 53.9122 1.15614 58.6509 -1.53863e-05L6.28691 52.3641C5.13566 57.1028 3.78644 61.6654 0 66.4041L52.3641 14.04C47.6253 11.1529 41.9063 9.94547 44.6108 8.29285Z"
        fill="#5E6AD2"
      />
    </svg>
  );
}
