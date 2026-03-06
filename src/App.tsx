import { FormEvent, useEffect, useMemo, useState } from "react";

const allowedWatchHosts = ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com"];
const participants = ["Nova", "Mira", "Axel", "Juno"];

type ChatMessage = {
  id: number;
  user: string;
  text: string;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

function App() {
  const [roomCode, setRoomCode] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [partyLive, setPartyLive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playheadSeconds, setPlayheadSeconds] = useState(421);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, user: "Nova", text: "Queue feels smooth now." },
    { id: 2, user: "Mira", text: "Sync is tight, no drift yet." }
  ]);
  const [fireReactions, setFireReactions] = useState(8);
  const [heartReactions, setHeartReactions] = useState(13);
  const [wowReactions, setWowReactions] = useState(4);
  const [blockedUser, setBlockedUser] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [moderationLog, setModerationLog] = useState<string[]>([
    "Host mode enabled",
    "Auto filters ON (hate/violence/sexual minors)"
  ]);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const watchHostStatus = useMemo(() => {
    if (!watchUrl.trim()) return "none";
    try {
      const parsed = new URL(watchUrl);
      return allowedWatchHosts.includes(parsed.hostname) ? "allowed" : "blocked";
    } catch {
      return "invalid";
    }
  }, [watchUrl]);

  useEffect(() => {
    if (!partyLive || !playing) return;
    const timer = setInterval(() => {
      setPlayheadSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [partyLive, playing]);

  const syncHealth = useMemo(() => {
    if (!partyLive) return "Waiting for launch";
    if (playing) return "Healthy • ±120ms drift";
    return "Paused • locked";
  }, [partyLive, playing]);

  const launchDisabled = !rightsConfirmed || watchHostStatus !== "allowed" || !roomCode.trim();

  const handleLaunchRoom = () => {
    setPartyLive(true);
    setPlaying(true);
    setModerationLog((current) => [`Room ${roomCode || "PULSE"} launched`, ...current]);
  };

  const handleSendChat = (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((current) => [
      ...current,
      { id: Date.now(), user: "You", text: chatInput.trim() }
    ]);
    setChatInput("");
  };

  const addBlockedUser = (event: FormEvent) => {
    event.preventDefault();
    const normalized = blockedUser.trim().toLowerCase();
    if (!normalized || blockedUsers.includes(normalized)) return;
    setBlockedUsers((current) => [...current, normalized]);
    setModerationLog((current) => [`Blocked @${normalized}`, ...current]);
    setBlockedUser("");
  };

  const handleReport = (event: FormEvent) => {
    event.preventDefault();
    setReportSubmitted(true);
    setModerationLog((current) => [`Report submitted: ${reportReason}`, ...current]);
  };

  const runModAction = (action: string) => {
    setModerationLog((current) => [`${action} action triggered`, ...current]);
  };

  return (
    <main className="app">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <section className="card">
        <header className="hero">
          <p className="eyebrow">KinoSpolu Labs • HEARO Core</p>
          <h1>KinoPulse Rooms</h1>
          <p className="lead">
            High-trust watch-party stack with social energy, moderation tooling, and legal-by-default
            launch controls.
          </p>
          <div className="status-row">
            <span className="chip chip-live">{partyLive ? "Room active" : "Ready to launch"}</span>
            <span className="chip chip-safe">{syncHealth}</span>
            <span className="chip">Viewers: {participants.length + 1}</span>
          </div>
        </header>

        <div className="layout layout-top">
          <section className="panel">
            <h2>Session composer</h2>
            <label>
              Room code
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="PULSE901"
              />
            </label>
            <label>
              Watch link
              <input
                value={watchUrl}
                onChange={(event) => setWatchUrl(event.target.value)}
                placeholder="https://youtube.com/..."
              />
            </label>
            {watchHostStatus === "allowed" && (
              <p className="ok">Host approved. Sync-ready media source detected.</p>
            )}
            {watchHostStatus === "blocked" && (
              <p className="warn">
                Host blocked in this mode. Keep provider allowlist strict for launch.
              </p>
            )}
            {watchHostStatus === "invalid" && (
              <p className="warn">Invalid URL format. Use full https:// provider link.</p>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) => setRightsConfirmed(event.target.checked)}
              />
              I confirm I have rights or permission to share this content in the room.
            </label>
            <button disabled={launchDisabled} type="button" onClick={handleLaunchRoom}>
              {partyLive ? "Room live" : "Launch room"}
            </button>
          </section>

          <section className="panel">
            <h2>Sync console</h2>
            <div className="sync-metrics">
              <div>
                <p className="metric-label">Playback</p>
                <p className="metric-value">{playing ? "Playing" : "Paused"}</p>
              </div>
              <div>
                <p className="metric-label">Playhead</p>
                <p className="metric-value">{formatTime(playheadSeconds)}</p>
              </div>
              <div>
                <p className="metric-label">Latency</p>
                <p className="metric-value">98ms</p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={3600}
              value={playheadSeconds % 3600}
              onChange={(event) => setPlayheadSeconds(Number(event.target.value))}
            />
            <div className="button-row">
              <button type="button" onClick={() => setPlaying((current) => !current)}>
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => setPlayheadSeconds((current) => current + 10)}>
                +10s
              </button>
              <button type="button" onClick={() => setPlayheadSeconds((current) => Math.max(0, current - 10))}>
                -10s
              </button>
            </div>
            <p className="subtle">Leader sync is simulated locally in this MVP shell.</p>
          </section>
        </div>

        <div className="layout layout-bottom">
          <section className="panel">
            <h2>Social lounge</h2>
            <div className="participants">
              {participants.map((name) => (
                <span key={name} className="pill">
                  {name}
                </span>
              ))}
            </div>
            <div className="chat-log">
              {chatMessages.map((message) => (
                <p key={message.id}>
                  <strong>{message.user}:</strong> {message.text}
                </p>
              ))}
            </div>
            <form className="inline-form" onSubmit={handleSendChat}>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Drop a message..."
              />
              <button type="submit">Send</button>
            </form>
            <div className="reactions">
              <button type="button" onClick={() => setFireReactions((n) => n + 1)}>
                🔥 {fireReactions}
              </button>
              <button type="button" onClick={() => setHeartReactions((n) => n + 1)}>
                ❤️ {heartReactions}
              </button>
              <button type="button" onClick={() => setWowReactions((n) => n + 1)}>
                ⚡ {wowReactions}
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Trust and moderation</h2>
            <ul>
              <li>Respect-first rules and rapid moderation for social rooms.</li>
              <li>Report flow is available for harassment, hate, sexual, or copyright abuse.</li>
              <li>Host actions include mute, remove, blocklist, and room freeze.</li>
            </ul>
            <div className="button-row">
              <button type="button" onClick={() => runModAction("Mute user")}>
                Mute user
              </button>
              <button type="button" onClick={() => runModAction("Remove user")}>
                Remove user
              </button>
              <button type="button" onClick={() => runModAction("Freeze room")}>
                Freeze room
              </button>
            </div>
            <form className="inline-form" onSubmit={addBlockedUser}>
              <input
                value={blockedUser}
                onChange={(event) => setBlockedUser(event.target.value)}
                placeholder="Block user handle..."
              />
              <button type="submit">Block</button>
            </form>
            {blockedUsers.length > 0 && (
              <p className="subtle">Blocked: {blockedUsers.map((u) => `@${u}`).join(", ")}</p>
            )}
            <form className="report" onSubmit={handleReport}>
              <h3>Report abuse</h3>
              <label>
                Reason
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                >
                  <option value="harassment">Harassment or bullying</option>
                  <option value="hate">Hate or violent content</option>
                  <option value="sexual">Sexual content involving minors</option>
                  <option value="copyright">Copyright infringement</option>
                </select>
              </label>
              <label>
                Details
                <textarea
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="Describe what happened and include room/user IDs."
                />
              </label>
              <button type="submit">Submit report</button>
              {reportSubmitted && (
                <p className="ok">Report captured. Connect this form to backend moderation queue.</p>
              )}
            </form>
          </section>
        </div>

        <div className="layout layout-bottom">
          <section className="panel legal">
            <h2>Legal hub</h2>
            <p>
              Keep these pages public and linked in Play Console:
              <a href="/legal/privacy.html" target="_blank" rel="noreferrer">
                Privacy
              </a>
              <a href="/legal/terms.html" target="_blank" rel="noreferrer">
                Terms
              </a>
              <a href="/legal/copyright.html" target="_blank" rel="noreferrer">
                Copyright policy
              </a>
            </p>
            <p className="note">
              This UI is a launch-ready base for your own brand. Validate policies with legal counsel
              before production.
            </p>
          </section>

          <section className="panel">
            <h2>Safety activity log</h2>
            <div className="chat-log">
              {moderationLog.map((event, index) => (
                <p key={`${event}-${index}`}>{event}</p>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
