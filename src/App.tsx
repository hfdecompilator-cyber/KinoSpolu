import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

const STORAGE_PREFIX = "kinopulse.v2";
const ACCOUNTS_KEY = `${STORAGE_PREFIX}.accounts`;
const SESSION_KEY = `${STORAGE_PREFIX}.session`;
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const allowedHosts = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "commondatastorage.googleapis.com"
];
const participantProfiles = [
  { name: "Nova", mood: "host" },
  { name: "Mira", mood: "hype" },
  { name: "Axel", mood: "focus" },
  { name: "Juno", mood: "chill" }
];
const quickSparkMessages = ["That cut was wild", "Sync is perfect now", "Drop another banger"];

type Account = {
  username: string;
  pin: string;
};

type Session = {
  username: string;
};

type RoomState = {
  roomCode: string;
  leader: string;
  videoUrl: string;
  playing: boolean;
  playhead: number;
  updatedAt: number;
};

type ChatMessage = {
  id: number;
  user: string;
  text: string;
  own: boolean;
  at: string;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const roomStorageKey = (roomCode: string) => `${STORAGE_PREFIX}.room.${roomCode}`;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const getClock = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const MetricTile = memo(function MetricTile({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
});

const ChatBubble = memo(function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={`bubble ${message.own ? "own" : ""}`}>
      <p className="bubble-meta">
        <strong>{message.user}</strong>
        <span>{message.at}</span>
      </p>
      <p className="bubble-text">{message.text}</p>
    </article>
  );
});

function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => readJson(ACCOUNTS_KEY, []));
  const [session, setSession] = useState<Session | null>(() => readJson(SESSION_KEY, null));
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authName, setAuthName] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authError, setAuthError] = useState("");

  const [roomCode, setRoomCode] = useState("");
  const [watchUrl, setWatchUrl] = useState(SAMPLE_VIDEO);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, user: "Nova", text: "Queue feels smooth now.", own: false, at: "09:14" },
    { id: 2, user: "Mira", text: "Sync is tight, no drift yet.", own: false, at: "09:15" }
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastHostPublishRef = useRef(0);

  const roomKey = useMemo(() => {
    const normalized = roomCode.trim().toUpperCase();
    return normalized ? roomStorageKey(normalized) : "";
  }, [roomCode]);

  const partyLive = !!roomState;
  const isHost = !!session && !!roomState && roomState.leader === session.username;

  const watchHostStatus = useMemo(() => {
    if (!watchUrl.trim()) return "none";
    try {
      const parsed = new URL(watchUrl);
      return allowedHosts.includes(parsed.hostname) ? "allowed" : "blocked";
    } catch {
      return "invalid";
    }
  }, [watchUrl]);

  const syncHealth = useMemo(() => {
    if (!roomState) return "Waiting for launch";
    if (roomState.playing) return "Healthy • ±120ms drift";
    return "Paused • locked";
  }, [roomState]);

  const engagementScore = useMemo(
    () => fireReactions + heartReactions + wowReactions + chatMessages.length * 2,
    [fireReactions, heartReactions, wowReactions, chatMessages.length]
  );

  const pushLog = useCallback((event: string) => {
    setModerationLog((current) => [event, ...current].slice(0, 14));
  }, []);

  const appendChat = useCallback((text: string, own: boolean) => {
    const clean = text.trim();
    if (!clean) return;
    setChatMessages((current) =>
      [
        ...current,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          user: own ? "You" : "System",
          text: clean,
          own,
          at: getClock()
        }
      ].slice(-70)
    );
  }, []);

  const persistSession = useCallback((next: Session | null) => {
    setSession(next);
    if (next) writeJson(SESSION_KEY, next);
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const handleAuthSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const username = authName.trim();
      const pin = authPin.trim();
      if (username.length < 3 || pin.length < 4) {
        setAuthError("Use a name (3+) and pin (4+).");
        return;
      }
      if (authMode === "register") {
        if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
          setAuthError("Name already exists, try login.");
          return;
        }
        const updated = [...accounts, { username, pin }];
        setAccounts(updated);
        writeJson(ACCOUNTS_KEY, updated);
        persistSession({ username });
        setAuthError("");
        return;
      }
      const found = accounts.find(
        (account) => account.username.toLowerCase() === username.toLowerCase() && account.pin === pin
      );
      if (!found) {
        setAuthError("Incorrect username or pin.");
        return;
      }
      persistSession({ username: found.username });
      setAuthError("");
    },
    [accounts, authMode, authName, authPin, persistSession]
  );

  const publishRoomState = useCallback(
    (next: Partial<RoomState>) => {
      setRoomState((current) => {
        if (!current || !roomKey) return current;
        const merged: RoomState = { ...current, ...next, updatedAt: Date.now() };
        writeJson(roomKey, merged);
        return merged;
      });
    },
    [roomKey]
  );

  const handleLaunchRoom = useCallback(() => {
    if (!session || !roomKey) return;
    const normalizedRoom = roomCode.trim().toUpperCase();
    const state: RoomState = {
      roomCode: normalizedRoom,
      leader: session.username,
      videoUrl: watchUrl.trim() || SAMPLE_VIDEO,
      playing: true,
      playhead: 0,
      updatedAt: Date.now()
    };
    writeJson(roomKey, state);
    setRoomState(state);
    appendChat("Room is now live. Everyone syncing in...", false);
    pushLog(`Room ${normalizedRoom} launched`);
  }, [appendChat, pushLog, roomCode, roomKey, session, watchUrl]);

  const handleJoinRoom = useCallback(() => {
    if (!roomKey) return;
    const loaded = readJson<RoomState | null>(roomKey, null);
    if (!loaded) {
      setAuthError("No room found with that code yet.");
      return;
    }
    setWatchUrl(loaded.videoUrl);
    setRoomState(loaded);
    setAuthError("");
    pushLog(`Joined room ${loaded.roomCode}`);
  }, [pushLog, roomKey]);

  const handleSendChat = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!chatInput.trim()) return;
      appendChat(chatInput, true);
      setChatInput("");
    },
    [appendChat, chatInput]
  );

  const sendQuickSpark = useCallback(
    (spark: string) => {
      appendChat(spark, true);
    },
    [appendChat]
  );

  const runModAction = useCallback(
    (action: string) => {
      pushLog(`${action} action triggered`);
    },
    [pushLog]
  );

  const addBlockedUser = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const normalized = blockedUser.trim().toLowerCase();
      if (!normalized || blockedUsers.includes(normalized)) return;
      setBlockedUsers((current) => [...current, normalized]);
      pushLog(`Blocked @${normalized}`);
      setBlockedUser("");
    },
    [blockedUser, blockedUsers, pushLog]
  );

  const handleReport = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setReportSubmitted(true);
      pushLog(`Report submitted: ${reportReason}`);
    },
    [pushLog, reportReason]
  );

  useEffect(() => {
    if (!partyLive || !roomKey) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== roomKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue) as RoomState;
        setRoomState((current) => {
          if (!current) return incoming;
          if (incoming.updatedAt <= current.updatedAt) return current;
          return incoming;
        });
      } catch {
        return;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [partyLive, roomKey]);

  useEffect(() => {
    if (!partyLive || !roomKey) return;
    const poll = setInterval(() => {
      const loaded = readJson<RoomState | null>(roomKey, null);
      if (!loaded) return;
      setRoomState((current) => {
        if (!current || loaded.updatedAt > current.updatedAt) return loaded;
        return current;
      });
    }, 1000);
    return () => clearInterval(poll);
  }, [partyLive, roomKey]);

  useEffect(() => {
    if (!roomState || !videoRef.current) return;
    const video = videoRef.current;
    if (!isHost) {
      const expected =
        roomState.playhead + (roomState.playing ? (Date.now() - roomState.updatedAt) / 1000 : 0);
      if (Math.abs(video.currentTime - expected) > 0.7) {
        video.currentTime = Math.max(0, expected);
      }
      if (roomState.playing) {
        const start = video.play();
        if (start) start.catch(() => {});
      } else {
        video.pause();
      }
    } else {
      if (roomState.playing) {
        const start = video.play();
        if (start) start.catch(() => {});
      } else {
        video.pause();
      }
    }
  }, [isHost, roomState]);

  const togglePlayback = useCallback(() => {
    if (!isHost || !roomState || !videoRef.current) return;
    const next = !roomState.playing;
    const video = videoRef.current;
    if (next) {
      const start = video.play();
      if (start) start.catch(() => {});
    } else {
      video.pause();
    }
    publishRoomState({ playing: next, playhead: video.currentTime });
  }, [isHost, publishRoomState, roomState]);

  const seekBy = useCallback(
    (delta: number) => {
      if (!isHost || !roomState || !videoRef.current) return;
      const next = Math.max(0, videoRef.current.currentTime + delta);
      videoRef.current.currentTime = next;
      publishRoomState({ playhead: next });
    },
    [isHost, publishRoomState, roomState]
  );

  const handleVideoTimeUpdate = useCallback(() => {
    if (!isHost || !videoRef.current || !roomState?.playing) return;
    const now = Date.now();
    if (now - lastHostPublishRef.current < 900) return;
    lastHostPublishRef.current = now;
    publishRoomState({ playhead: videoRef.current.currentTime });
  }, [isHost, publishRoomState, roomState?.playing]);

  const syncNow = useCallback(() => {
    if (!roomState || !videoRef.current) return;
    const expected =
      roomState.playhead + (roomState.playing ? (Date.now() - roomState.updatedAt) / 1000 : 0);
    videoRef.current.currentTime = Math.max(0, expected);
  }, [roomState]);

  const launchDisabled =
    !session || !rightsConfirmed || watchHostStatus !== "allowed" || !roomCode.trim();

  if (!session) {
    return (
      <main className="auth-root">
        <section className="auth-card">
          <h1>KinoPulse Rooms</h1>
          <p className="subtle">Simple account flow with auto-login restore on app restart.</p>
          <div className="button-row">
            <button type="button" onClick={() => setAuthMode("register")}>
              Register
            </button>
            <button type="button" onClick={() => setAuthMode("login")}>
              Login
            </button>
          </div>
          <form className="report" onSubmit={handleAuthSubmit}>
            <label>
              Username
              <input
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                placeholder="your_name"
              />
            </label>
            <label>
              PIN
              <input
                value={authPin}
                onChange={(event) => setAuthPin(event.target.value)}
                placeholder="1234"
                type="password"
              />
            </label>
            {authError && <p className="warn">{authError}</p>}
            <button type="submit">{authMode === "register" ? "Create account" : "Login"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <section className="card">
        <header className="hero">
          <div className="hero-topline">
            <p className="eyebrow">KinoSpolu Labs • HEARO Core</p>
            <span className="hero-badge">Auto-login restored for {session.username}</span>
          </div>
          <h1>KinoPulse Rooms</h1>
          <p className="lead">
            Cinematic lobby plus high-energy chat, optimized to stay responsive even as rooms get
            active.
          </p>
          <div className="status-row">
            <span className="chip chip-live">{partyLive ? "Room active" : "Ready to launch"}</span>
            <span className="chip chip-safe">{syncHealth}</span>
            <span className="chip">Viewers: {participantProfiles.length + 1}</span>
            <span className="chip">Engagement: {engagementScore}</span>
            <span className="chip">Role: {isHost ? "Host" : "Guest"}</span>
          </div>
          <div className="button-row">
            <button type="button" onClick={() => persistSession(null)}>
              Logout
            </button>
          </div>
        </header>

        <div className="layout layout-top">
          <section className="panel lobby-panel">
            <h2>Lobby composer</h2>
            <p className="subtle">
              Prime the room, validate source rights, and launch a synchronized session.
            </p>
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
                placeholder={SAMPLE_VIDEO}
              />
            </label>
            {watchHostStatus === "allowed" && (
              <p className="ok">Host approved. Sync-ready media source detected.</p>
            )}
            {watchHostStatus === "blocked" && (
              <p className="warn">Host blocked in this mode. Keep provider allowlist strict.</p>
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
            <div className="button-row">
              <button disabled={launchDisabled} type="button" onClick={handleLaunchRoom}>
                Launch room
              </button>
              <button type="button" onClick={handleJoinRoom}>
                Join room
              </button>
            </div>
          </section>

          <section className="panel sync-panel">
            <h2>Sync console</h2>
            <div className="sync-metrics">
              <MetricTile
                label="Playback"
                value={roomState?.playing ? "Playing" : partyLive ? "Paused" : "Idle"}
              />
              <MetricTile
                label="Playhead"
                value={formatTime(videoRef.current?.currentTime ?? roomState?.playhead ?? 0)}
              />
              <MetricTile label="Latency" value="98ms" />
            </div>
            <video
              className="video-stage"
              ref={videoRef}
              src={roomState?.videoUrl || watchUrl || SAMPLE_VIDEO}
              preload="metadata"
              onTimeUpdate={handleVideoTimeUpdate}
            />
            <div className="button-row">
              <button type="button" onClick={togglePlayback} disabled={!partyLive || !isHost}>
                {roomState?.playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => seekBy(10)} disabled={!partyLive || !isHost}>
                +10s
              </button>
              <button type="button" onClick={() => seekBy(-10)} disabled={!partyLive || !isHost}>
                -10s
              </button>
              <button type="button" onClick={syncNow} disabled={!partyLive}>
                Sync now
              </button>
            </div>
            <div className="presence-strip">
              {participantProfiles.map((participant) => (
                <span key={participant.name}>{participant.name}</span>
              ))}
            </div>
            <p className="subtle">Video sync state is shared via room storage and live updates.</p>
          </section>
        </div>

        <div className="layout layout-bottom">
          <section className="panel chat-panel">
            <div className="panel-head">
              <h2>Social lounge</h2>
              <p className="subtle">Live room chat</p>
            </div>

            <div className="participants">
              {participantProfiles.map((participant) => (
                <span key={participant.name} className={`pill pill-${participant.mood}`}>
                  {participant.name}
                </span>
              ))}
            </div>

            <div className="chat-shell">
              {chatMessages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>

            <div className="quick-row">
              {quickSparkMessages.map((spark) => (
                <button key={spark} type="button" className="quick" onClick={() => sendQuickSpark(spark)}>
                  {spark}
                </button>
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
