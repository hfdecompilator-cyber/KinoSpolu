import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

const STORAGE_PREFIX = "kinopulse.v3";
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
  privateLobby: boolean;
  locked: boolean;
  approvedUsers: string[];
  joinQueue: string[];
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
const lastRoomKey = (username: string) => `${STORAGE_PREFIX}.lastRoom.${username}`;

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
  const [session, setSession] = useState<Session | null>(() => readJson(SESSION_KEY, null));
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  const [roomCode, setRoomCode] = useState("");
  const [watchUrl, setWatchUrl] = useState(SAMPLE_VIDEO);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [joinPending, setJoinPending] = useState(false);

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

  const username = session?.username ?? "";
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const roomKey = normalizedRoomCode ? roomStorageKey(normalizedRoomCode) : "";
  const partyLive = !!roomState;
  const isHost = !!roomState && roomState.leader === username;

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

  const rememberRoom = useCallback(
    (nextRoomCode: string) => {
      if (!username) return;
      localStorage.setItem(lastRoomKey(username), nextRoomCode);
    },
    [username]
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

  const handleAuthSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const clean = authName.trim();
      if (clean.length < 2) {
        setAuthError("Use at least 2 characters.");
        return;
      }
      persistSession({ username: clean });
      setAuthError("");
    },
    [authName, persistSession]
  );

  const useQuickGuest = useCallback(() => {
    const name = `Guest${Math.floor(Math.random() * 900 + 100)}`;
    persistSession({ username: name });
    setAuthError("");
  }, [persistSession]);

  const generateRoomCode = useCallback(() => {
    const generated = `PULSE${Math.floor(Math.random() * 900 + 100)}`;
    setRoomCode(generated);
  }, []);

  const handleLaunchRoom = useCallback(() => {
    if (!username || !roomKey) return;
    const state: RoomState = {
      roomCode: normalizedRoomCode,
      leader: username,
      videoUrl: watchUrl.trim() || SAMPLE_VIDEO,
      playing: true,
      playhead: 0,
      updatedAt: Date.now(),
      privateLobby: true,
      locked: false,
      approvedUsers: [username],
      joinQueue: []
    };
    writeJson(roomKey, state);
    setRoomState(state);
    setJoinPending(false);
    rememberRoom(state.roomCode);
    appendChat("Room is now live. Everyone syncing in...", false);
    pushLog(`Room ${state.roomCode} launched`);
    setAuthError("");
  }, [appendChat, normalizedRoomCode, pushLog, rememberRoom, roomKey, username, watchUrl]);

  const handleJoinRoom = useCallback(() => {
    if (!username || !roomKey) return;
    const loaded = readJson<RoomState | null>(roomKey, null);
    if (!loaded) {
      setAuthError("No room found with that code yet.");
      return;
    }

    const canEnter =
      loaded.leader === username ||
      loaded.approvedUsers.includes(username) ||
      !loaded.privateLobby;

    if (canEnter) {
      setWatchUrl(loaded.videoUrl);
      setRoomState(loaded);
      setJoinPending(false);
      setAuthError("");
      rememberRoom(loaded.roomCode);
      pushLog(`Joined room ${loaded.roomCode}`);
      return;
    }

    if (loaded.locked) {
      setJoinPending(false);
      setAuthError("Private lobby is locked by host.");
      return;
    }

    if (!loaded.joinQueue.includes(username)) {
      const updated = {
        ...loaded,
        joinQueue: [...loaded.joinQueue, username],
        updatedAt: Date.now()
      };
      writeJson(roomKey, updated);
    }
    setJoinPending(true);
    setAuthError("Join request sent. Waiting for host approval.");
  }, [pushLog, rememberRoom, roomKey, username]);

  const togglePrivateLobby = useCallback(() => {
    if (!isHost || !roomState) return;
    if (roomState.privateLobby) {
      const approvedUsers = Array.from(new Set([...roomState.approvedUsers, ...roomState.joinQueue]));
      publishRoomState({ privateLobby: false, approvedUsers, joinQueue: [] });
      pushLog("Private lobby disabled. Pending users approved.");
      return;
    }
    publishRoomState({ privateLobby: true });
    pushLog("Private lobby enabled.");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const toggleLobbyLock = useCallback(() => {
    if (!isHost || !roomState) return;
    publishRoomState({ locked: !roomState.locked });
    pushLog(roomState.locked ? "Lobby unlocked" : "Lobby locked");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const approveJoinRequest = useCallback(
    (user: string) => {
      if (!isHost || !roomState) return;
      const approvedUsers = Array.from(new Set([...roomState.approvedUsers, user]));
      const joinQueue = roomState.joinQueue.filter((entry) => entry !== user);
      publishRoomState({ approvedUsers, joinQueue });
      pushLog(`Approved @${user} to join private lobby`);
    },
    [isHost, publishRoomState, pushLog, roomState]
  );

  const denyJoinRequest = useCallback(
    (user: string) => {
      if (!isHost || !roomState) return;
      const joinQueue = roomState.joinQueue.filter((entry) => entry !== user);
      publishRoomState({ joinQueue });
      pushLog(`Denied @${user} join request`);
    },
    [isHost, publishRoomState, pushLog, roomState]
  );

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
    if (!username) return;
    const lastRoom = localStorage.getItem(lastRoomKey(username));
    if (!lastRoom) return;
    setRoomCode((current) => current || lastRoom);
    const loaded = readJson<RoomState | null>(roomStorageKey(lastRoom), null);
    if (!loaded) return;
    if (loaded.leader === username || loaded.approvedUsers.includes(username) || !loaded.privateLobby) {
      setWatchUrl(loaded.videoUrl);
      setRoomState(loaded);
    }
  }, [username]);

  useEffect(() => {
    if (!roomKey) return;
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
  }, [roomKey]);

  useEffect(() => {
    if (!roomKey) return;
    const poll = setInterval(() => {
      const loaded = readJson<RoomState | null>(roomKey, null);
      if (!loaded) return;
      if (joinPending && username && loaded.approvedUsers.includes(username)) {
        setWatchUrl(loaded.videoUrl);
        setRoomState(loaded);
        setJoinPending(false);
        setAuthError("");
        rememberRoom(loaded.roomCode);
        pushLog(`Host approved ${username}`);
      }
      setRoomState((current) => {
        if (!current) return current;
        if (loaded.updatedAt > current.updatedAt) return loaded;
        return current;
      });
    }, 900);
    return () => clearInterval(poll);
  }, [joinPending, pushLog, rememberRoom, roomKey, username]);

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
      return;
    }
    if (roomState.playing) {
      const start = video.play();
      if (start) start.catch(() => {});
    } else {
      video.pause();
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

  const launchDisabled = !username || !rightsConfirmed || watchHostStatus !== "allowed" || !roomKey;

  if (!session) {
    return (
      <main className="auth-root">
        <section className="auth-card">
          <h1>KinoPulse Rooms</h1>
          <p className="subtle">One-step profile. Auto-login restores after app restart.</p>
          <form className="report" onSubmit={handleAuthSubmit}>
            <label>
              Display name
              <input
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                placeholder="your_name"
              />
            </label>
            {authError && <p className="warn">{authError}</p>}
            <div className="button-row">
              <button type="submit">Start watching</button>
              <button type="button" onClick={useQuickGuest}>
                Quick guest
              </button>
            </div>
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
            <p className="eyebrow">KinoSpolu Labs • Pulse Social</p>
            <span className="hero-badge">Auto-login active for {username}</span>
          </div>
          <h1>KinoPulse Rooms</h1>
          <p className="lead">Fast private watch parties with host-controlled sync and moderation.</p>
          <div className="status-row">
            <span className="chip chip-live">{partyLive ? "Room active" : "Ready to launch"}</span>
            <span className="chip chip-safe">{syncHealth}</span>
            <span className="chip">Engagement: {engagementScore}</span>
            <span className="chip">Role: {isHost ? "Host" : "Guest"}</span>
            {roomState && <span className="chip">{roomState.privateLobby ? "Private lobby" : "Open lobby"}</span>}
          </div>
          <div className="button-row">
            <button type="button" onClick={() => persistSession(null)}>
              Switch profile
            </button>
          </div>
        </header>

        <div className="layout layout-top">
          <section className="panel lobby-panel">
            <h2>Quick lobby</h2>
            <p className="subtle">Create or join with one code. Private mode starts enabled.</p>
            <label>
              Room code
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="PULSE901"
              />
            </label>
            <div className="button-row">
              <button type="button" onClick={generateRoomCode}>
                Generate code
              </button>
            </div>
            <label>
              Watch link
              <input
                value={watchUrl}
                onChange={(event) => setWatchUrl(event.target.value)}
                placeholder={SAMPLE_VIDEO}
              />
            </label>
            {watchHostStatus === "allowed" && <p className="ok">Sync-ready media source detected.</p>}
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
            {joinPending && <p className="ok">Join request queued. Host approval will auto-connect you.</p>}
            {authError && <p className="warn">{authError}</p>}
            <div className="button-row">
              <button disabled={launchDisabled} type="button" onClick={handleLaunchRoom}>
                Launch private room
              </button>
              <button type="button" onClick={handleJoinRoom}>
                Join room
              </button>
            </div>
          </section>

          <section className="panel sync-panel">
            <h2>Sync console</h2>
            <div className="sync-metrics">
              <MetricTile label="Playback" value={roomState?.playing ? "Playing" : partyLive ? "Paused" : "Idle"} />
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
                {roomState?.playing ? "Pause (host)" : "Play (host)"}
              </button>
              <button type="button" onClick={() => seekBy(10)} disabled={!partyLive || !isHost}>
                +10s host
              </button>
              <button type="button" onClick={() => seekBy(-10)} disabled={!partyLive || !isHost}>
                -10s host
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
            <p className="subtle">Host drives playback. Guests auto-follow shared room state.</p>
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
              <li>Host-only playback controls and private lobby approvals.</li>
              <li>Report flow is available for harassment, hate, sexual, or copyright abuse.</li>
              <li>Fast moderation actions include mute, remove, and blocklist.</li>
            </ul>
            {roomState && isHost && (
              <section className="queue-box">
                <h3>Private lobby controls</h3>
                <div className="button-row">
                  <button type="button" onClick={togglePrivateLobby}>
                    {roomState.privateLobby ? "Disable private mode" : "Enable private mode"}
                  </button>
                  <button type="button" onClick={toggleLobbyLock}>
                    {roomState.locked ? "Unlock lobby" : "Lock lobby"}
                  </button>
                </div>
                {roomState.joinQueue.length === 0 ? (
                  <p className="subtle">No pending join requests.</p>
                ) : (
                  <div className="queue-list">
                    {roomState.joinQueue.map((requestUser) => (
                      <div key={requestUser} className="queue-item">
                        <span>@{requestUser}</span>
                        <div className="queue-actions">
                          <button type="button" onClick={() => approveJoinRequest(requestUser)}>
                            Approve
                          </button>
                          <button type="button" onClick={() => denyJoinRequest(requestUser)}>
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
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
                <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
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
            <p className="note">Validate policies with legal counsel before production launch.</p>
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
