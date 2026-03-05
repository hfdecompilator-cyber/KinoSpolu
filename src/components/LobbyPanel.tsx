import { FormEvent, useState } from "react";
import { SAMPLE_VIDEO_URL } from "../lib/utils";
import type { AppMode, AppUser } from "../types";

interface LobbyPanelProps {
  user: AppUser;
  mode: AppMode;
  statusMessage: string | null;
  onSignOut: () => Promise<void>;
  onCreateParty: (title: string, videoUrl: string) => Promise<void>;
  onJoinParty: (code: string) => Promise<void>;
}

export function LobbyPanel({
  user,
  mode,
  statusMessage,
  onSignOut,
  onCreateParty,
  onJoinParty,
}: LobbyPanelProps) {
  const [partyTitle, setPartyTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState(SAMPLE_VIDEO_URL);
  const [joinCode, setJoinCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    await onCreateParty(partyTitle, videoUrl);
    setIsBusy(false);
  };

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    await onJoinParty(joinCode);
    setIsBusy(false);
  };

  return (
    <section className="card">
      <header className="row spread">
        <div>
          <p className="label">Logged in as</p>
          <h2>{user.name}</h2>
          <p className="muted">{user.email || "Guest mode"}</p>
        </div>
        <button className="ghost" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </header>

      <div className="callout">
        Party mode: <strong>{mode === "live" ? "Live Supabase mode" : "Demo mode"}</strong>
      </div>

      <div className="grid-two">
        <form onSubmit={submitCreate} className="stack panel">
          <h3>Create watch party</h3>
          <label>
            Party title
            <input
              required
              value={partyTitle}
              onChange={(event) => setPartyTitle(event.target.value)}
              placeholder="Friday movie night"
            />
          </label>
          <label>
            Video URL (MP4/HLS)
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <button type="submit" className="primary" disabled={isBusy}>
            Launch party
          </button>
        </form>

        <form onSubmit={submitJoin} className="stack panel">
          <h3>Join by code</h3>
          <label>
            Party code
            <input
              required
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
            />
          </label>
          <button type="submit" className="secondary" disabled={isBusy}>
            Join party
          </button>
          <p className="muted small">Tip: share the code with friends to sync playback and chat.</p>
        </form>
      </div>

      {statusMessage ? <div className="callout">{statusMessage}</div> : null}
    </section>
  );
}
