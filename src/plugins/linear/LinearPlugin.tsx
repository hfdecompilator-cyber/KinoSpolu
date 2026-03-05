import { useState, useEffect } from "react";
import {
  useLinearAuth,
  useLinearIssues,
  useLinearTeams,
  createLinearIssue,
  clearStoredApiKey,
} from "./useLinear";
import { LinearSettingsModal } from "./LinearSettingsModal";
import type { PluginPanelProps } from "../types";
import type { CreateIssueInput } from "./types";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "./types";

type View = "issues" | "create";

export function LinearPlugin({ context, onClose }: PluginPanelProps) {
  const { apiKey, user, verifyAndSave, disconnect } = useLinearAuth();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const { issues, loading, error: issuesError, fetchMyIssues } = useLinearIssues(apiKey);
  const { teams, states, fetchTeams } = useLinearTeams(apiKey);
  const [view, setView] = useState<View>("issues");
  const [stateFilter, setStateFilter] = useState<string>("all");

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

  const filteredIssues =
    stateFilter === "all"
      ? issues
      : issues.filter((i) => i.state.type === stateFilter);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <Header
        user={user}
        onSettings={() => setShowSettings(true)}
        onDisconnect={() => {
          disconnect();
          setShowSettings(true);
        }}
        onClose={onClose}
      />

      <div className="flex border-b border-white/10">
        <TabButton active={view === "issues"} onClick={() => setView("issues")}>
          My Issues
        </TabButton>
        <TabButton active={view === "create"} onClick={() => setView("create")}>
          + Create Issue
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "issues" && (
          <IssuesView
            issues={filteredIssues}
            loading={loading}
            error={issuesError}
            stateFilter={stateFilter}
            onFilterChange={setStateFilter}
            onRefresh={fetchMyIssues}
          />
        )}
        {view === "create" && (
          <CreateIssueView
            apiKey={apiKey!}
            teams={teams}
            states={states}
            context={context}
            onCreated={() => {
              setView("issues");
              fetchMyIssues();
            }}
          />
        )}
      </div>
    </div>
  );
}

function Header({
  user,
  onSettings,
  onDisconnect,
  onClose,
}: {
  user: { name: string; email: string; avatarUrl?: string } | null;
  onSettings: () => void;
  onDisconnect: () => void;
  onClose?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
      <div className="w-7 h-7 rounded-lg bg-[#5e6ad2]/20 flex items-center justify-center flex-shrink-0">
        <LinearLogoSmall />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white">Linear</h3>
        {user && <p className="text-xs text-white/40 truncate">{user.name}</p>}
      </div>
      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 rounded-xl bg-slate-800 border border-white/10 shadow-xl z-10 overflow-hidden">
              <button
                onClick={() => { onSettings(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                Settings
              </button>
              <button
                onClick={() => { onDisconnect(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "text-[#5e6ad2] border-[#5e6ad2]"
          : "text-white/50 border-transparent hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function IssuesView({
  issues,
  loading,
  error,
  stateFilter,
  onFilterChange,
  onRefresh,
}: {
  issues: ReturnType<typeof useLinearIssues>["issues"];
  loading: boolean;
  error: string | null;
  stateFilter: string;
  onFilterChange: (v: string) => void;
  onRefresh: () => void;
}) {
  const stateTypes = [
    { value: "all", label: "All" },
    { value: "unstarted", label: "Todo" },
    { value: "started", label: "In Progress" },
    { value: "completed", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="flex gap-1 flex-1 flex-wrap">
          {stateTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => onFilterChange(t.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                stateFilter === t.value
                  ? "bg-[#5e6ad2] text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
          title="Refresh"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading && issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/30">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-spin"
          >
            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
          <span className="text-sm">Loading issues...</span>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-white/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12h6M9 8h6M9 16h4" />
          </svg>
          <span className="text-sm">No issues found</span>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: ReturnType<typeof useLinearIssues>["issues"][0] }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
    >
      <div
        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: issue.state.color }}
        title={issue.state.name}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-white/30 font-mono">{issue.identifier}</span>
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[issue.priority] ?? "#6b7280" }}
            title={PRIORITY_LABELS[issue.priority] ?? "Unknown priority"}
          />
        </div>
        <p className="text-sm text-white/90 leading-snug group-hover:text-white transition-colors line-clamp-2">
          {issue.title}
        </p>
        <p className="text-xs text-white/30 mt-0.5">{issue.team.name}</p>
      </div>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="flex-shrink-0 mt-1 text-white/20 group-hover:text-white/50 transition-colors"
      >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  );
}

function CreateIssueView({
  apiKey,
  teams,
  states,
  context,
  onCreated,
}: {
  apiKey: string;
  teams: { id: string; name: string; key: string }[];
  states: { id: string; name: string; color: string; type: string; team: { id: string; name: string } }[];
  context?: PluginPanelProps["context"];
  onCreated: () => void;
}) {
  const defaultTitle = context?.partyName
    ? `Watch party: ${context.partyName}`
    : "";

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
      const input: CreateIssueInput = {
        title,
        description: description || undefined,
        teamId,
        priority,
        stateId: stateId || undefined,
      };
      const created = await createLinearIssue(apiKey, input);
      if (created) {
        setResult({ identifier: created.identifier, url: created.url });
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create issue");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Issue created!</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5e6ad2] hover:text-[#7b84e3] text-sm font-mono underline"
          >
            {result.identifier}
          </a>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => {
              setResult(null);
              setTitle(defaultTitle);
              setDescription("");
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
          >
            Create Another
          </button>
          <button
            onClick={onCreated}
            className="px-4 py-2 rounded-xl bg-[#5e6ad2] hover:bg-[#6b78e5] text-white text-sm font-medium transition-colors"
          >
            View Issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          required
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/50 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/50 transition-all"
          >
            {teams.length === 0 && <option value="">Loading...</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-800">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Status</label>
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/50 transition-all"
          >
            {teamStates.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-800">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Priority</label>
        <div className="flex gap-2">
          {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setPriority(Number(val))}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                priority === Number(val)
                  ? "border-[#5e6ad2] bg-[#5e6ad2]/20 text-white"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
              title={label}
            >
              <span
                className="w-2 h-2 rounded-full inline-block mr-1"
                style={{ backgroundColor: PRIORITY_COLORS[Number(val)] }}
              />
              {label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !teamId}
        className="w-full py-3 rounded-xl bg-[#5e6ad2] hover:bg-[#6b78e5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors mt-2"
      >
        {submitting ? "Creating..." : "Create Issue"}
      </button>
    </form>
  );
}

function LinearLogoSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.22541 61.5228C0.14298 59.0595 0.727634 56.7297 1.81006 54.9301L25.6391 78.7591C23.8395 79.8415 21.5097 80.4261 19.0464 79.3437L1.22541 61.5228Z" fill="#5E6AD2" />
      <path d="M9.15723 72.9222L27.0781 90.8431C28.6405 92.4055 30.5784 92.9489 32.4247 92.9489L7.07173 67.5959C7.07173 69.4422 7.61519 71.3801 9.15723 72.9222Z" fill="#5E6AD2" />
      <path d="M14.8712 78.6361L21.3641 85.1291L64.0435 41.8577C67.7949 38.1062 68.587 32.3872 65.7 28.0364L14.8712 78.6361Z" fill="#5E6AD2" />
      <path d="M28.6898 92.4558L35.1827 98.9488C39.5336 96.0618 43.8844 91.711 47.6358 87.9594L100 35.5953C96.213 40.334 92.8633 44.8966 90.1686 50.4228L71.7534 31.0763C77.2795 28.3816 81.8421 25.0319 86.5809 21.2449L34.2168 73.6091C30.4654 77.3605 26.8062 81.6803 23.9192 86.0312C25.5728 88.1677 27.2264 90.4143 28.6898 92.4558Z" fill="#5E6AD2" />
      <path d="M44.6108 8.29285C49.3496 4.50588 53.9122 1.15614 58.6509 -1.53863e-05L6.28691 52.3641C5.13566 57.1028 3.78644 61.6654 0 66.4041L52.3641 14.04C47.6253 11.1529 41.9063 9.94547 44.6108 8.29285Z" fill="#5E6AD2" />
    </svg>
  );
}
