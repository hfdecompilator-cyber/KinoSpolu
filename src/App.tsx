import { FormEvent, useMemo, useState } from "react";

const allowedWatchHosts = ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com"];

function App() {
  const [roomCode, setRoomCode] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
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

  const handleReport = (event: FormEvent) => {
    event.preventDefault();
    setReportSubmitted(true);
  };

  return (
    <main className="app">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <section className="card">
        <header className="hero">
          <p className="eyebrow">KinoSpolu Labs</p>
          <h1>KinoPulse Rooms</h1>
          <p className="lead">
            Premium watch-party shell with social controls and legal-by-default launch guardrails.
          </p>
          <div className="status-row">
            <span className="chip chip-live">Live sync scaffold</span>
            <span className="chip chip-safe">Policy-first mode</span>
          </div>
        </header>

        <div className="layout">
          <section className="panel composer">
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
              <p className="ok">Host approved for demo launch.</p>
            )}
            {watchHostStatus === "blocked" && (
              <p className="warn">
                Host blocked in demo mode. Keep provider allowlist strict for production.
              </p>
            )}
            {watchHostStatus === "invalid" && (
              <p className="warn">Invalid URL format. Use a full https:// provider link.</p>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) => setRightsConfirmed(event.target.checked)}
              />
              I confirm I have rights or permission to share this content in the room.
            </label>
            <button disabled={!rightsConfirmed || watchHostStatus !== "allowed"} type="button">
              Launch room
            </button>
          </section>

          <section className="panel">
            <h2>Trust and moderation</h2>
            <ul>
              <li>Respect-first rules and rapid moderation for social rooms.</li>
              <li>Report flow is available for harassment, hate, sexual, or copyright abuse.</li>
              <li>Host actions should include mute, remove, and room freeze.</li>
            </ul>
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
        </section>

        <p className="note">
          This UI is a launch-ready base for your own brand. Validate policies with legal counsel
          before production.
        </p>
      </section>
    </main>
  );
}

export default App;
