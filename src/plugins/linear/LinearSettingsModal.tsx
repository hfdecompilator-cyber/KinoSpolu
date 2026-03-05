import { useState } from "react";
import { motion } from "framer-motion";
import { useLinearAuth } from "./useLinear";
import type { PluginSettingsProps } from "../types";
import { LinearLogoIcon } from "../../App";

export function LinearSettingsModal({ onSave, onCancel }: PluginSettingsProps) {
  const { verifying, error, verifyAndSave } = useLinearAuth();
  const [keyInput, setKeyInput] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyAndSave(keyInput.trim());
    if (ok) onSave({ apiKey: keyInput.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,3,12,0.85)", backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md overflow-hidden rounded-3xl"
        style={{
          background: "rgba(10,10,26,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(94,106,210,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Gradient header */}
        <div className="relative overflow-hidden px-8 pt-8 pb-7">
          {/* Aurora blobs inside modal */}
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(94,106,210,0.5),transparent_70%)] blur-2xl pointer-events-none" />
          <div className="absolute -top-4 right-0 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.4),transparent_70%)] blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(94,106,210,0.15)] border border-[rgba(94,106,210,0.3)] flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 4px 20px rgba(94,106,210,0.3)" }}>
              <LinearLogoIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Connect Linear</h2>
              <p className="text-sm text-white/40">Authenticate with your Personal API key</p>
            </div>
            <button onClick={onCancel}
              className="ml-auto p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-2.5 uppercase tracking-wider">
              Personal API Key
            </label>
            <div className={`relative rounded-xl transition-all duration-200 ${
              focused ? "ring-2 ring-[rgba(94,106,210,0.35)] ring-offset-0" : ""
            }`}>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="lin_api_••••••••••••••••••••"
                required
                className="input-glass w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                style={{ caretColor: "#7b84e3" }}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/30">
              Generate at{" "}
              <a href="https://linear.app/settings/api" target="_blank" rel="noopener noreferrer"
                className="text-[#7b84e3] hover:text-[#a5acf5] underline underline-offset-2 transition-colors">
                linear.app/settings/api
              </a>
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="btn-ghost flex-1 py-3 rounded-xl text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={verifying || !keyInput.trim()}
              className="btn-linear flex-1 py-3 rounded-xl text-sm relative overflow-hidden">
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="animate-spin">
                    <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8" />
                  </svg>
                  Verifying…
                </span>
              ) : "Connect →"}
            </button>
          </div>
        </form>

        {/* What this plugin does */}
        <div className="px-8 pb-8">
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">
              What you'll get
            </p>
            <ul className="space-y-2.5">
              {[
                "View and filter your assigned issues",
                "Create issues directly from a watch party",
                "Auto-link issues to session context",
                "Priority, status, and team selectors",
              ].map((cap, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="2.5"
                    className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
