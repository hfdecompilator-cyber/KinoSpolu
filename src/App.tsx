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
      <section className="card">
        <h1>HEARO by KinoSpolu</h1>
        <p className="lead">
          Social watch party foundation with legal and Play Store guardrails enabled.
        </p>

        <section className="panel">
          <h2>Room setup</h2>
          <label>
            Room code
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="HEARO123"
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
            <p className="ok">Provider check passed for this demo host.</p>
          )}
          {watchHostStatus === "blocked" && (
            <p className="warn">
              This host is blocked in demo mode. Only approved providers should be enabled.
            </p>
          )}
          {watchHostStatus === "invalid" && (
            <p className="warn">URL is invalid. Paste a full https:// link.</p>
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
            Start watch party
          </button>
        </section>

        <section className="panel">
          <h2>Social safety</h2>
          <ul>
            <li>Community rules require respectful behavior and lawful sharing.</li>
            <li>Report flow is available for harassment, hate, sexual, or copyright abuse.</li>
            <li>Host moderation actions should include mute, remove, and room lock.</li>
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
              <p className="ok">
                Report submitted locally. Wire this to your backend moderation queue.
              </p>
            )}
          </form>
        </section>

        <section className="panel legal">
          <h2>Legal links</h2>
          <p>
            Keep these pages published and linked in Play Console listing:
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
          Note: This is a compliance-focused starter, not legal advice. Review with your lawyer
          before production launch.
        </p>
      </section>
    </main>
  );
}

export default App;
