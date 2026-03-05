import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useLinearAuth,
  useLinearIssues,
  useLinearTeams,
  createLinearIssue,
} from "./useLinear";
import { LinearSettingsModal } from "./LinearSettingsModal";
import type { PluginPanelProps } from "../types";
import type { CreateIssueInput } from "./types";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "./types";
import { LinearLogoIcon } from "../../App";

type Tab = "issues" | "create";

const PRIORITY_ICONS: Record<number, string> = {
  0: "—",
  1: "🔴",
  2: "🟠",
  3: "🟡",
  4: "🔵",
};

const STATE_TYPE_LABELS: Record<string, string> = {
  triage: "Triage",
  backlog: "Backlog",
  unstarted: "Todo",
  started: "In Progress",
  completed: "Done",
  cancelled: "Cancelled",
};

export function LinearPlugin({ context, onClose }: PluginPanelProps) {
  const { apiKey, user, verifyAndSave, disconnect } = useLinearAuth();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const { issues, loading, error: issuesError, fetchMyIssues } = useLinearIssues(apiKey);
  const { teams, states, fetchTeams } = useLinearTeams(apiKey);
  const [tab, setTab] = useState<Tab>("issues");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    if (apiKey && !showSettings) {
      fetchMyIssues();
      fetchTeams();
    }
  }, [apiKey, showSettings, fetchMyIssues, fetchTeams]);

  if (showSettings) {
    return (
      <LinearSettingsModal
        onSave={() => {
          setShowSettings(false);
          fetchMyIssues();
          fetchTeams();
        }}
        onCancel={() => {
          if (apiKey) setShowSettings(false);
          else onClose?.();
        }}
      />
    );
  }

  const filtered =
    stateFilter === "all" ? issues : issues.filter((i) => i.state.type === stateFilter);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-65px)]">
      {/* Left sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] p-6 flex flex-col gap-6">
        {/* User card */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5e6ad2] to-[#7b84e3] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "L"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name ?? "Linear User"}</p>
            <p className="text-xs text-white/35 truncate">{user?.email ?? ""}</p>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1">Navigation</p>
          {([
            { id: "issues", label: "My Issues", icon: <IssueIcon /> },
            { id: "create", label: "Create Issue", icon: <PlusIcon /> },
          ] as const).map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                tab === item.id
                  ? "bg-[rgba(94,106,210,0.18)] text-[#7b84e3] border border-[rgba(94,106,210,0.3)]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}>
              <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
              {item.label}
              {item.id === "issues" && issues.length > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/30 font-mono">
                  {issues.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Disconnect */}
        <div className="mt-auto pt-6 border-t border-white/[0.07]">
          <button
            onClick={() => { disconnect(); setShowSettings(true); }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-white/25 hover:text-red-400 hover:bg-red-500/[0.08] transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Disconnect account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {tab === "issues" && (
            <motion.div key="issues" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col h-full">
              <IssuesPanel
                issues={filtered}
                allIssues={issues}
                loading={loading}
                error={issuesError}
                stateFilter={stateFilter}
                onFilterChange={setStateFilter}
                onRefresh={fetchMyIssues}
              />
            </motion.div>
          )}
          {tab === "create" && (
            <motion.div key="create" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col h-full overflow-y-auto">
              <CreateIssuePanel
                apiKey={apiKey!}
                teams={teams}
                states={states}
                context={context}
                onCreated={() => { setTab("issues"); fetchMyIssues(); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Issues panel ─── */
function IssuesPanel({
  issues, allIssues, loading, error, stateFilter, onFilterChange, onRefresh,
}: {
  issues: ReturnType<typeof useLinearIssues>["issues"];
  allIssues: ReturnType<typeof useLinearIssues>["issues"];
  loading: boolean;
  error: string | null;
  stateFilter: string;
  onFilterChange: (v: string) => void;
  onRefresh: () => void;
}) {
  const filters = [
    { value: "all", label: "All", count: allIssues.length },
    { value: "unstarted", label: "Todo", count: allIssues.filter((i) => i.state.type === "unstarted").length },
    { value: "started", label: "In Progress", count: allIssues.filter((i) => i.state.type === "started").length },
    { value: "completed", label: "Done", count: allIssues.filter((i) => i.state.type === "completed").length },
    { value: "cancelled", label: "Cancelled", count: allIssues.filter((i) => i.state.type === "cancelled").length },
  ];

  return (
    <>
      {/* Filter bar */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto">
        <div className="flex gap-1.5 flex-1 flex-nowrap">
          {filters.map((f) => (
            <button key={f.value} onClick={() => onFilterChange(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                stateFilter === f.value
                  ? "bg-[rgba(94,106,210,0.2)] text-[#7b84e3] border border-[rgba(94,106,210,0.35)]"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.05] border border-transparent"
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-px rounded-full ${
                  stateFilter === f.value ? "bg-[rgba(94,106,210,0.3)] text-[#7b84e3]" : "bg-white/8 text-white/25"
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="p-2 rounded-lg btn-ghost flex-shrink-0 disabled:opacity-30" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={loading ? "animate-spin" : ""}>
            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {loading && issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/25">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="animate-spin">
              <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
            </svg>
            <span className="text-sm">Loading issues…</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/25">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 12h6M9 8h6M9 16h4" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium">No issues found</p>
              <p className="text-xs mt-1 text-white/20">Nothing assigned in this filter</p>
            </div>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}>
            {issues.map((issue) => (
              <motion.div key={issue.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}>
                <IssueRow issue={issue} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}

function IssueRow({ issue }: { issue: ReturnType<typeof useLinearIssues>["issues"][0] }) {
  return (
    <a href={issue.url} target="_blank" rel="noopener noreferrer"
      className="group flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-all">
      {/* State dot */}
      <div className="flex-shrink-0 w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-110"
        style={{ borderColor: issue.state.color, backgroundColor: issue.state.type === "completed" ? issue.state.color : "transparent" }}
        title={issue.state.name} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-white/25 font-mono flex-shrink-0">{issue.identifier}</span>
          <span className="text-[10px] px-1.5 py-px rounded bg-white/5 text-white/30 flex-shrink-0">
            {issue.team.key}
          </span>
        </div>
        <p className="text-sm text-white/80 group-hover:text-white transition-colors font-medium leading-snug line-clamp-1">
          {issue.title}
        </p>
      </div>

      {/* Priority */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[issue.priority] ?? "#6b7280" }}
          title={PRIORITY_LABELS[issue.priority]} />
        <span className="text-xs text-white/25 hidden md:block">{PRIORITY_LABELS[issue.priority] ?? ""}</span>
      </div>

      {/* State badge */}
      <div className="flex-shrink-0">
        <span className="text-[10px] px-2 py-1 rounded-lg font-medium"
          style={{ backgroundColor: `${issue.state.color}18`, color: issue.state.color, border: `1px solid ${issue.state.color}30` }}>
          {issue.state.name}
        </span>
      </div>

      {/* External link */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="flex-shrink-0 text-white/15 group-hover:text-white/50 transition-colors">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  );
}

/* ─── Create issue panel ─── */
function CreateIssuePanel({ apiKey, teams, states, context, onCreated }: {
  apiKey: string;
  teams: { id: string; name: string; key: string }[];
  states: { id: string; name: string; color: string; type: string; team: { id: string; name: string } }[];
  context?: PluginPanelProps["context"];
  onCreated: () => void;
}) {
  const defaultTitle = context?.partyName ? `Watch party: ${context.partyName}` : "";
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(
    context?.videoTitle ? `Watching: ${context.videoTitle}` : ""
  );
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [priority, setPriority] = useState(0);
  const [stateId, setStateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ identifier: string; url: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (teams.length > 0 && !teamId) setTeamId(teams[0].id);
  }, [teams, teamId]);

  useEffect(() => {
    const teamStates = states.filter((s) => s.team.id === teamId);
    const todoState = teamStates.find((s) => s.type === "unstarted");
    setStateId(todoState?.id ?? teamStates[0]?.id ?? "");
  }, [teamId, states]);

  const teamStates = states.filter((s) => s.team.id === teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const input: CreateIssueInput = { title, description: description || undefined, teamId, priority, stateId: stateId || undefined };
      const created = await createLinearIssue(apiKey, input);
      if (created) setResult({ identifier: created.identifier, url: created.url });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create issue");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center flex-1 gap-6 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-xl mb-1">Issue created!</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            className="text-[#5e6ad2] hover:text-[#7b84e3] font-mono text-sm underline">
            {result.identifier}
          </a>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setResult(null); setTitle(defaultTitle); setDescription(""); }}
            className="btn-ghost px-5 py-2.5 rounded-xl text-sm">
            Create Another
          </button>
          <button onClick={onCreated} className="btn-linear px-5 py-2.5 rounded-xl text-sm">
            View Issues
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">New Issue</h2>
        <p className="text-sm text-white/35">Create a Linear issue from your current session.</p>
      </div>

      {context?.partyName && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[rgba(94,106,210,0.08)] border border-[rgba(94,106,210,0.2)] text-xs text-[#7b84e3] flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Created from watch party: <strong className="text-[#a5acf5]">{context.partyName}</strong>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title…" required
          className="input-glass w-full px-4 py-3 rounded-xl text-sm" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some details…" rows={3}
          className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none" />
      </div>

      {/* Team + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Team</label>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required
            className="input-glass w-full px-3 py-3 rounded-xl text-sm">
            {teams.length === 0 && <option value="">Loading…</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0d0d20]">{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Status</label>
          <select value={stateId} onChange={(e) => setStateId(e.target.value)}
            className="input-glass w-full px-3 py-3 rounded-xl text-sm">
            {teamStates.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0d0d20]">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Priority</label>
        <div className="flex gap-2">
          {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setPriority(Number(val))}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                priority === Number(val)
                  ? "border-[rgba(94,106,210,0.5)] bg-[rgba(94,106,210,0.15)] text-[#7b84e3]"
                  : "border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white/60 hover:bg-white/[0.06]"
              }`}
              title={label}>
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[Number(val)] }} />
              <span className="hidden md:block">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {submitError}
        </div>
      )}

      <button type="submit" disabled={submitting || !title.trim() || !teamId}
        className="btn-linear w-full py-3.5 rounded-xl text-sm">
        {submitting ? "Creating…" : "Create Issue"}
      </button>
    </form>
  );
}

/* ─── Icon helpers ─── */
function IssueIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 12h6M9 8h6M9 16h4" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
