import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_PREFIX = "kinopulse.v4";
const SESSION_KEY = `${STORAGE_PREFIX}.session`;
const SETTINGS_KEY = `${STORAGE_PREFIX}.settings`;
const PROFILES_KEY = `${STORAGE_PREFIX}.profiles`;
const SERVICE_KEY = `${STORAGE_PREFIX}.service`;
const SERVICE_AUTH_KEY = `${STORAGE_PREFIX}.serviceAuth`;
const ACH_FIRST_ROOM_KEY = `${STORAGE_PREFIX}.achievement.firstRoom`;
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

type StreamingService = {
  id: string;
  name: string;
  tag: string;
  accent: string;
  accentRgb: string;
  domains: string[];
  externalOnly: boolean;
  legalHint: string;
  loginUrl: string;
  browseUrl: string;
};

type Session = {
  username: string;
  serviceId: string;
};

type RoomState = {
  roomCode: string;
  leader: string;
  serviceId: string;
  mediaTitle: string;
  mediaUrl: string;
  playing: boolean;
  playhead: number;
  updatedAt: number;
  privateLobby: boolean;
  locked: boolean;
  approvedUsers: string[];
  joinQueue: string[];
  slowModeSec: number;
  chatLocked: boolean;
  announcement: string;
};

type ChatMessage = {
  id: number;
  user: string;
  text: string;
  own: boolean;
  at: string;
};

type UserSettings = {
  compactChat: boolean;
  reduceMotion: boolean;
  autoSyncOnJoin: boolean;
};

type TabKey = "chat" | "participants" | "tools";

const serviceCatalog: StreamingService[] = [
  {
    id: "netflix",
    name: "Netflix",
    tag: "N",
    accent: "#e50914",
    accentRgb: "229,9,20",
    domains: ["www.netflix.com", "netflix.com"],
    externalOnly: true,
    legalHint: "Every viewer must use their own Netflix account.",
    loginUrl: "https://www.netflix.com/login",
    browseUrl: "https://www.netflix.com/browse"
  },
  {
    id: "hulu",
    name: "Hulu",
    tag: "H",
    accent: "#1ce783",
    accentRgb: "28,231,131",
    domains: ["www.hulu.com", "hulu.com"],
    externalOnly: true,
    legalHint: "Users sign in with personal Hulu plans.",
    loginUrl: "https://auth.hulu.com/web/login",
    browseUrl: "https://www.hulu.com/hub/home"
  },
  {
    id: "disney",
    name: "Disney+",
    tag: "D+",
    accent: "#113ccf",
    accentRgb: "17,60,207",
    domains: ["www.disneyplus.com", "disneyplus.com"],
    externalOnly: true,
    legalHint: "Sync room coordinates playback; no stream rebroadcasting.",
    loginUrl: "https://www.disneyplus.com/login",
    browseUrl: "https://www.disneyplus.com/home"
  },
  {
    id: "max",
    name: "Max",
    tag: "M",
    accent: "#5e3bff",
    accentRgb: "94,59,255",
    domains: ["play.max.com", "www.max.com", "max.com"],
    externalOnly: true,
    legalHint: "Each viewer needs eligible Max access.",
    loginUrl: "https://auth.max.com/login",
    browseUrl: "https://play.max.com"
  },
  {
    id: "prime",
    name: "Prime Video",
    tag: "P",
    accent: "#00a8e1",
    accentRgb: "0,168,225",
    domains: ["www.primevideo.com", "primevideo.com"],
    externalOnly: true,
    legalHint: "Users should sign in with personal Prime subscriptions.",
    loginUrl: "https://www.primevideo.com/ap/signin",
    browseUrl: "https://www.primevideo.com/storefront/home/"
  },
  {
    id: "paramount",
    name: "Paramount+",
    tag: "P+",
    accent: "#0078ff",
    accentRgb: "0,120,255",
    domains: ["www.paramountplus.com", "paramountplus.com"],
    externalOnly: true,
    legalHint: "Paramount+ parties require each viewer's own access.",
    loginUrl: "https://www.paramountplus.com/account/signin/",
    browseUrl: "https://www.paramountplus.com"
  },
  {
    id: "peacock",
    name: "Peacock",
    tag: "PK",
    accent: "#ffd400",
    accentRgb: "255,212,0",
    domains: ["www.peacocktv.com", "peacocktv.com"],
    externalOnly: true,
    legalHint: "Open Peacock in secure tab for account login.",
    loginUrl: "https://www.peacocktv.com/signin",
    browseUrl: "https://www.peacocktv.com/watch/home"
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    tag: "CR",
    accent: "#f47521",
    accentRgb: "244,117,33",
    domains: ["www.crunchyroll.com", "crunchyroll.com"],
    externalOnly: true,
    legalHint: "Anime parties require user-owned Crunchyroll access.",
    loginUrl: "https://sso.crunchyroll.com/login",
    browseUrl: "https://www.crunchyroll.com"
  },
  {
    id: "youtube",
    name: "YouTube",
    tag: "YT",
    accent: "#ff0033",
    accentRgb: "255,0,51",
    domains: ["www.youtube.com", "youtube.com", "youtu.be"],
    externalOnly: true,
    legalHint: "Use official YouTube links and respect creator rights.",
    loginUrl: "https://accounts.google.com/ServiceLogin?service=youtube",
    browseUrl: "https://www.youtube.com"
  },
  {
    id: "twitch",
    name: "Twitch",
    tag: "TW",
    accent: "#9146ff",
    accentRgb: "145,70,255",
    domains: ["www.twitch.tv", "twitch.tv"],
    externalOnly: true,
    legalHint: "Live content opens on official Twitch pages.",
    loginUrl: "https://www.twitch.tv/login",
    browseUrl: "https://www.twitch.tv/directory"
  },
  {
    id: "appletv",
    name: "Apple TV+",
    tag: "TV+",
    accent: "#b6b6b6",
    accentRgb: "182,182,182",
    domains: ["tv.apple.com", "www.apple.com"],
    externalOnly: true,
    legalHint: "Users authenticate with Apple ID through Apple pages.",
    loginUrl: "https://tv.apple.com",
    browseUrl: "https://tv.apple.com"
  },
  {
    id: "tubi",
    name: "Tubi",
    tag: "TB",
    accent: "#ff5f26",
    accentRgb: "255,95,38",
    domains: ["tubitv.com", "www.tubitv.com"],
    externalOnly: true,
    legalHint: "Free catalog, still open official Tubi page for source links.",
    loginUrl: "https://tubitv.com/signin",
    browseUrl: "https://tubitv.com"
  },
  {
    id: "direct",
    name: "Licensed Direct URL",
    tag: "URL",
    accent: "#2d72ff",
    accentRgb: "45,114,255",
    domains: ["commondatastorage.googleapis.com"],
    externalOnly: false,
    legalHint: "Host only content you own or are licensed to distribute.",
    loginUrl: "https://example.com",
    browseUrl: "https://example.com"
  }
];

const participantProfiles = [
  { name: "Nova", mood: "host" },
  { name: "Mira", mood: "hype" },
  { name: "Axel", mood: "focus" },
  { name: "Juno", mood: "chill" }
];

const quickSparkMessages = ["That cut was wild", "Sync is perfect now", "Drop another banger"];

const defaultSettings: UserSettings = {
  compactChat: false,
  reduceMotion: false,
  autoSyncOnJoin: true
};

const roomStorageKey = (roomCode: string) => `${STORAGE_PREFIX}.room.${roomCode}`;
const lastRoomKey = (username: string) => `${STORAGE_PREFIX}.lastRoom.${username}`;
const rulesKey = (roomCode: string, username: string) =>
  `${STORAGE_PREFIX}.rules.${roomCode}.${username}`;

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

const upsertProfile = (profiles: string[], profile: string) => {
  const normalized = profile.trim();
  if (!normalized) return profiles;
  return [normalized, ...profiles.filter((entry) => entry !== normalized)].slice(0, 6);
};

const getServiceById = (serviceId: string | null | undefined) =>
  serviceCatalog.find((service) => service.id === serviceId) ?? serviceCatalog[0];

const normalizeRoomState = (state: RoomState | null): RoomState | null => {
  if (!state) return null;
  return {
    ...state,
    serviceId: state.serviceId || "direct",
    mediaTitle: state.mediaTitle || "Watch party stream",
    mediaUrl: state.mediaUrl || SAMPLE_VIDEO,
    privateLobby: state.privateLobby ?? true,
    locked: state.locked ?? false,
    approvedUsers: Array.isArray(state.approvedUsers) ? state.approvedUsers : [],
    joinQueue: Array.isArray(state.joinQueue) ? state.joinQueue : [],
    slowModeSec: typeof state.slowModeSec === "number" ? state.slowModeSec : 0,
    chatLocked: !!state.chatLocked,
    announcement: typeof state.announcement === "string" ? state.announcement : ""
  };
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
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(() =>
    localStorage.getItem(SERVICE_KEY)
  );
  const [serviceAuth, setServiceAuth] = useState<Record<string, boolean>>(() =>
    readJson<Record<string, boolean>>(SERVICE_AUTH_KEY, {})
  );
  const [session, setSession] = useState<Session | null>(() => readJson(SESSION_KEY, null));
  const [recentProfiles, setRecentProfiles] = useState<string[]>(() => readJson(PROFILES_KEY, []));
  const [settings, setSettings] = useState<UserSettings>(() =>
    readJson<UserSettings>(SETTINGS_KEY, defaultSettings)
  );

  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authGuided, setAuthGuided] = useState(false);
  const [authInfo, setAuthInfo] = useState("");

  const [roomCode, setRoomCode] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [watchUrl, setWatchUrl] = useState(SAMPLE_VIDEO);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [joinPending, setJoinPending] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [announcementDraft, setAnnouncementDraft] = useState("");
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [achievement, setAchievement] = useState<{ title: string; body: string } | null>(null);
  const [notice, setNotice] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastHostPublishRef = useRef(0);
  const lastGuestChatRef = useRef(0);
  const noticeTimeoutRef = useRef<number | null>(null);
  const achievementTimeoutRef = useRef<number | null>(null);

  const selectedService = useMemo(
    () => getServiceById(selectedServiceId || session?.serviceId),
    [selectedServiceId, session?.serviceId]
  );
  const themeClass = `theme-${selectedService.id}`;
  const serviceConnected = selectedService.id === "direct" || !!serviceAuth[selectedService.id];
  const currentPath = location.pathname || "/";

  const username = session?.username ?? "";
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const roomKey = normalizedRoomCode ? roomStorageKey(normalizedRoomCode) : "";
  const partyLive = !!roomState;
  const isHost = !!roomState && roomState.leader === username;

  const tabs = useMemo<TabKey[]>(
    () => (isHost ? ["chat", "participants", "tools"] : ["chat", "participants"]),
    [isHost]
  );

  const syncHealth = useMemo(() => {
    if (!roomState) return "Waiting for launch";
    if (roomState.playing) return "Healthy • ±120ms drift";
    return "Paused • locked";
  }, [roomState]);

  const engagementScore = useMemo(
    () => fireReactions + heartReactions + wowReactions + chatMessages.length * 2,
    [fireReactions, heartReactions, wowReactions, chatMessages.length]
  );

  const effectiveService = useMemo(
    () => getServiceById(roomState?.serviceId || selectedService.id),
    [roomState?.serviceId, selectedService.id]
  );

  const inAppVideoUrl = useMemo(() => {
    if (!roomState) return SAMPLE_VIDEO;
    if (effectiveService.externalOnly) return SAMPLE_VIDEO;
    return roomState.mediaUrl || SAMPLE_VIDEO;
  }, [effectiveService.externalOnly, roomState]);

  const participantList = useMemo(() => {
    if (!roomState) return participantProfiles.map((entry) => ({ ...entry, role: "viewer" }));
    const approved = roomState.approvedUsers.map((entry) => ({
      name: entry,
      mood: "focus",
      role: entry === roomState.leader ? "host" : "viewer"
    }));
    const merged = [...participantProfiles.map((entry) => ({ ...entry, role: "viewer" })), ...approved];
    const dedup = Array.from(new Map(merged.map((entry) => [entry.name.toLowerCase(), entry])).values());
    return dedup;
  }, [roomState]);

  const allowedDomainStatus = useMemo(() => {
    if (!watchUrl.trim()) return "none";
    try {
      const parsed = new URL(watchUrl);
      if (selectedService.domains.includes(parsed.hostname)) return "allowed";
      return "blocked";
    } catch {
      return "invalid";
    }
  }, [selectedService.domains, watchUrl]);

  const domainCompliant = selectedService.externalOnly
    ? allowedDomainStatus === "allowed"
    : allowedDomainStatus !== "invalid";

  const launchDisabled =
    !session ||
    !rightsConfirmed ||
    !domainCompliant ||
    !normalizedRoomCode ||
    !serviceConnected;

  const flashNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const pushLog = useCallback((event: string) => {
    setModerationLog((current) => [event, ...current].slice(0, 18));
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
      ].slice(-90)
    );
  }, []);

  const rememberProfile = useCallback((profile: string) => {
    setRecentProfiles((current) => {
      const updated = upsertProfile(current, profile);
      writeJson(PROFILES_KEY, updated);
      return updated;
    });
  }, []);

  const rememberRoom = useCallback(
    (nextRoomCode: string) => {
      if (!username) return;
      localStorage.setItem(lastRoomKey(username), nextRoomCode);
    },
    [username]
  );

  const persistServiceChoice = useCallback(
    (serviceId: string) => {
      localStorage.setItem(SERVICE_KEY, serviceId);
      setSelectedServiceId(serviceId);
      if (session) {
        const updated = { ...session, serviceId };
        setSession(updated);
        writeJson(SESSION_KEY, updated);
      }
    },
    [session]
  );

  const patchServiceAuth = useCallback((serviceId: string, value: boolean) => {
    setServiceAuth((current) => {
      const updated = { ...current, [serviceId]: value };
      writeJson(SERVICE_AUTH_KEY, updated);
      return updated;
    });
  }, []);

  const openSecureServiceTab = useCallback(
    async (url: string, toolbarColor: string) => {
      if (!url) return;
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, toolbarColor, presentationStyle: "fullscreen" });
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    []
  );

  const patchSettings = useCallback((next: Partial<UserSettings>) => {
    setSettings((current) => {
      const updated = { ...current, ...next };
      writeJson(SETTINGS_KEY, updated);
      return updated;
    });
  }, []);

  const persistSession = useCallback((next: Session | null) => {
    setSession(next);
    if (next) writeJson(SESSION_KEY, next);
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const switchProfile = useCallback(() => {
    persistSession(null);
    setRoomState(null);
    setJoinPending(false);
    setAuthError("");
    navigate("/auth");
  }, [navigate, persistSession]);

  const resetServiceSelection = useCallback(() => {
    localStorage.removeItem(SERVICE_KEY);
    setSelectedServiceId(null);
    setAuthGuided(false);
    setAuthInfo("");
    navigate("/services");
  }, [navigate]);

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

  const unlockAchievement = useCallback((title: string, body: string) => {
    setAchievement({ title, body });
    if (achievementTimeoutRef.current !== null) window.clearTimeout(achievementTimeoutRef.current);
    achievementTimeoutRef.current = window.setTimeout(() => setAchievement(null), 2800);
  }, []);

  const chooseService = useCallback((serviceId: string) => {
    persistServiceChoice(serviceId);
    setAuthError("");
    setAuthGuided(false);
    setAuthInfo("");
    navigate("/auth");
  }, [navigate, persistServiceChoice]);

  const startServiceSignIn = useCallback(async () => {
    if (selectedService.id === "direct") {
      patchServiceAuth("direct", true);
      setAuthGuided(true);
      setAuthInfo("Direct URL mode does not require external account sign-in.");
      return;
    }
    try {
      await openSecureServiceTab(selectedService.loginUrl, selectedService.accent);
      setAuthGuided(true);
      setAuthInfo(
        `Secure ${selectedService.name} tab opened. Sign in there, then return and confirm below.`
      );
    } catch {
      setAuthInfo("Could not open sign-in tab. Try again.");
    }
  }, [
    openSecureServiceTab,
    patchServiceAuth,
    selectedService.accent,
    selectedService.id,
    selectedService.loginUrl,
    selectedService.name
  ]);

  const confirmServiceSignIn = useCallback(() => {
    patchServiceAuth(selectedService.id, true);
    setAuthInfo(`${selectedService.name} sign-in marked complete.`);
    flashNotice(`${selectedService.name} connected for this profile.`);
  }, [flashNotice, patchServiceAuth, selectedService.id, selectedService.name]);

  const openServiceCatalog = useCallback(async () => {
    const target =
      selectedService.id === "direct"
        ? watchUrl || SAMPLE_VIDEO
        : selectedService.browseUrl;
    try {
      await openSecureServiceTab(target, selectedService.accent);
      flashNotice(`${selectedService.name} opened in secure tab.`);
    } catch {
      flashNotice("Could not open service tab.");
    }
  }, [
    flashNotice,
    openSecureServiceTab,
    selectedService.accent,
    selectedService.browseUrl,
    selectedService.id,
    selectedService.name,
    watchUrl
  ]);

  const pasteWatchUrlFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      flashNotice("Clipboard read is unavailable on this device.");
      return;
    }
    try {
      const clipped = (await navigator.clipboard.readText()).trim();
      if (!clipped) {
        flashNotice("Clipboard is empty.");
        return;
      }
      setWatchUrl(clipped);
      flashNotice("Watch link pasted from clipboard.");
    } catch {
      flashNotice("Clipboard read failed. Paste manually.");
    }
  }, [flashNotice]);

  const handleAuthSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!selectedService.id) return;
      if (!serviceConnected) {
        setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
        return;
      }
      const clean = authName.trim();
      const generated = `Guest${Math.floor(Math.random() * 900 + 100)}`;
      const nextName = clean || generated;
      persistSession({ username: nextName, serviceId: selectedService.id });
      rememberProfile(nextName);
      setAuthError("");
      setAuthName("");
      unlockAchievement("Profile Ready", `${nextName} connected to ${selectedService.name}`);
      navigate("/lobby");
    },
    [
      authName,
      persistSession,
      rememberProfile,
      selectedService.id,
      selectedService.name,
      serviceConnected,
      unlockAchievement,
      navigate
    ]
  );

  const useQuickGuest = useCallback(() => {
    if (!selectedService.id) return;
    if (!serviceConnected) {
      setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
      return;
    }
    const name = `Guest${Math.floor(Math.random() * 900 + 100)}`;
    persistSession({ username: name, serviceId: selectedService.id });
    rememberProfile(name);
    setAuthError("");
    setAuthName("");
    unlockAchievement("Quick Entry", `${name} joined instantly`);
    navigate("/lobby");
  }, [
    persistSession,
    rememberProfile,
    selectedService.id,
    selectedService.name,
    serviceConnected,
    unlockAchievement,
    navigate
  ]);

  const loginRecentProfile = useCallback(
    (profile: string) => {
      if (!selectedService.id) return;
      if (!serviceConnected) {
        setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
        return;
      }
      persistSession({ username: profile, serviceId: selectedService.id });
      rememberProfile(profile);
      setAuthError("");
      setAuthName("");
      navigate("/lobby");
    },
    [persistSession, rememberProfile, selectedService.id, selectedService.name, serviceConnected, navigate]
  );

  const generateRoomCode = useCallback(() => {
    setRoomCode(`PULSE${Math.floor(Math.random() * 900 + 100)}`);
  }, []);

  const copyRoomCode = useCallback(() => {
    if (!normalizedRoomCode) {
      flashNotice("Enter or generate a room code first.");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      flashNotice("Clipboard unavailable on this device.");
      return;
    }
    void navigator.clipboard
      .writeText(normalizedRoomCode)
      .then(() => flashNotice("Room code copied."))
      .catch(() => flashNotice("Copy failed. Please copy manually."));
  }, [flashNotice, normalizedRoomCode]);

  const copyInvite = useCallback(() => {
    if (!normalizedRoomCode) {
      flashNotice("Generate a room code first.");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      flashNotice("Clipboard unavailable on this device.");
      return;
    }
    const message = `Join my ${selectedService.name} watch party in KinoPulse. Room: ${normalizedRoomCode}`;
    void navigator.clipboard
      .writeText(message)
      .then(() => flashNotice("Invite message copied."))
      .catch(() => flashNotice("Copy failed. Please copy manually."));
  }, [flashNotice, normalizedRoomCode, selectedService.name]);

  const handleLaunchRoom = useCallback(() => {
    if (!session || !roomKey) return;
    const state: RoomState = {
      roomCode: normalizedRoomCode,
      leader: session.username,
      serviceId: selectedService.id,
      mediaTitle: mediaTitle.trim() || `${selectedService.name} Watch Party`,
      mediaUrl: watchUrl.trim() || SAMPLE_VIDEO,
      playing: true,
      playhead: 0,
      updatedAt: Date.now(),
      privateLobby: true,
      locked: false,
      approvedUsers: [session.username],
      joinQueue: [],
      slowModeSec: 0,
      chatLocked: false,
      announcement: ""
    };
    writeJson(roomKey, state);
    setRoomState(state);
    setJoinPending(false);
    setRulesAccepted(true);
    rememberRoom(state.roomCode);
    appendChat("Room is now live. Everyone syncing in...", false);
    pushLog(`Room ${state.roomCode} launched`);
    if (!localStorage.getItem(ACH_FIRST_ROOM_KEY)) {
      localStorage.setItem(ACH_FIRST_ROOM_KEY, "1");
      unlockAchievement("Achievement Unlocked", "Launched your first public-capable lobby");
    }
    navigate("/room");
  }, [
    appendChat,
    mediaTitle,
    normalizedRoomCode,
    pushLog,
    rememberRoom,
    roomKey,
    selectedService.id,
    selectedService.name,
    session,
    unlockAchievement,
    watchUrl,
    navigate
  ]);

  const handleJoinRoom = useCallback(() => {
    if (!session || !roomKey) return;
    if (!serviceConnected) {
      setAuthError(`Sign in to ${selectedService.name} in secure tab before joining.`);
      return;
    }
    const loaded = normalizeRoomState(readJson<RoomState | null>(roomKey, null));
    if (!loaded) {
      setAuthError("No room found with that code.");
      return;
    }

    if (loaded.serviceId !== selectedService.id) {
      persistServiceChoice(loaded.serviceId);
      setAuthError(`Switched to ${getServiceById(loaded.serviceId).name} for this room.`);
    }

    const canEnter =
      loaded.leader === session.username ||
      loaded.approvedUsers.includes(session.username) ||
      !loaded.privateLobby;

    if (canEnter) {
      setRoomState(loaded);
      setWatchUrl(loaded.mediaUrl);
      setMediaTitle(loaded.mediaTitle);
      setJoinPending(false);
      setAuthError("");
      rememberRoom(loaded.roomCode);
      pushLog(`Joined room ${loaded.roomCode}`);
      navigate("/room");
      return;
    }

    if (loaded.locked) {
      setJoinPending(false);
      setAuthError("Private lobby is locked by host.");
      return;
    }

    if (!loaded.joinQueue.includes(session.username)) {
      const updated = {
        ...loaded,
        joinQueue: [...loaded.joinQueue, session.username],
        updatedAt: Date.now()
      };
      writeJson(roomKey, updated);
    }

    setJoinPending(true);
    setAuthError("Join request sent. Waiting for host approval.");
  }, [
    persistServiceChoice,
    pushLog,
    rememberRoom,
    roomKey,
    selectedService.name,
    selectedService.id,
    serviceConnected,
    session,
    navigate
  ]);

  const acceptRules = useCallback(() => {
    if (!roomState || !session) return;
    localStorage.setItem(rulesKey(roomState.roomCode, session.username), "1");
    setRulesAccepted(true);
  }, [roomState, session]);

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

  const toggleChatLock = useCallback(() => {
    if (!isHost || !roomState) return;
    publishRoomState({ chatLocked: !roomState.chatLocked });
    pushLog(roomState.chatLocked ? "Chat unlocked" : "Chat locked");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const setSlowMode = useCallback(
    (value: number) => {
      if (!isHost || !roomState) return;
      publishRoomState({ slowModeSec: value });
      pushLog(value === 0 ? "Slow mode disabled" : `Slow mode set to ${value}s`);
    },
    [isHost, publishRoomState, pushLog, roomState]
  );

  const approveJoinRequest = useCallback(
    (user: string) => {
      if (!isHost || !roomState) return;
      const approvedUsers = Array.from(new Set([...roomState.approvedUsers, user]));
      const joinQueue = roomState.joinQueue.filter((entry) => entry !== user);
      publishRoomState({ approvedUsers, joinQueue });
      pushLog(`Approved @${user}`);
    },
    [isHost, publishRoomState, pushLog, roomState]
  );

  const denyJoinRequest = useCallback(
    (user: string) => {
      if (!isHost || !roomState) return;
      const joinQueue = roomState.joinQueue.filter((entry) => entry !== user);
      publishRoomState({ joinQueue });
      pushLog(`Denied @${user}`);
    },
    [isHost, publishRoomState, pushLog, roomState]
  );

  const approveAllJoinRequests = useCallback(() => {
    if (!isHost || !roomState || roomState.joinQueue.length === 0) return;
    const approvedUsers = Array.from(new Set([...roomState.approvedUsers, ...roomState.joinQueue]));
    publishRoomState({ approvedUsers, joinQueue: [] });
    pushLog(`Approved all (${roomState.joinQueue.length})`);
  }, [isHost, publishRoomState, pushLog, roomState]);

  const denyAllJoinRequests = useCallback(() => {
    if (!isHost || !roomState || roomState.joinQueue.length === 0) return;
    publishRoomState({ joinQueue: [] });
    pushLog(`Denied all (${roomState.joinQueue.length})`);
  }, [isHost, publishRoomState, pushLog, roomState]);

  const pauseForAll = useCallback(() => {
    if (!isHost || !roomState || !videoRef.current) return;
    videoRef.current.pause();
    publishRoomState({ playing: false, playhead: videoRef.current.currentTime });
    pushLog("Host paused playback for everyone");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const playForAll = useCallback(() => {
    if (!isHost || !roomState || !videoRef.current) return;
    const start = videoRef.current.play();
    if (start) start.catch(() => {});
    publishRoomState({ playing: true, playhead: videoRef.current.currentTime });
    pushLog("Host resumed playback for everyone");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const restartForAll = useCallback(() => {
    if (!isHost || !roomState || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    const start = videoRef.current.play();
    if (start) start.catch(() => {});
    publishRoomState({ playhead: 0, playing: true });
    pushLog("Host restarted from 00:00");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const postAnnouncement = useCallback(() => {
    if (!isHost || !roomState) return;
    const clean = announcementDraft.trim();
    if (!clean) return;
    publishRoomState({ announcement: clean });
    appendChat(`Host announcement: ${clean}`, false);
    setAnnouncementDraft("");
    pushLog("Announcement posted");
  }, [announcementDraft, appendChat, isHost, publishRoomState, pushLog, roomState]);

  const clearAnnouncement = useCallback(() => {
    if (!isHost || !roomState || !roomState.announcement) return;
    publishRoomState({ announcement: "" });
    pushLog("Announcement cleared");
  }, [isHost, publishRoomState, pushLog, roomState]);

  const handleSendChat = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!chatInput.trim()) return;
      if (!rulesAccepted && !isHost) {
        setChatError("Please accept room rules to chat.");
        return;
      }
      if (roomState?.chatLocked && !isHost) {
        setChatError("Chat is temporarily locked by host.");
        return;
      }
      if (roomState && !isHost && roomState.slowModeSec > 0) {
        const now = Date.now();
        const remainingMs = roomState.slowModeSec * 1000 - (now - lastGuestChatRef.current);
        if (remainingMs > 0) {
          setChatError(`Slow mode active. Wait ${Math.ceil(remainingMs / 1000)}s.`);
          return;
        }
        lastGuestChatRef.current = now;
      }
      setChatError("");
      appendChat(chatInput, true);
      setChatInput("");
    },
    [appendChat, chatInput, isHost, roomState, rulesAccepted]
  );

  const sendQuickSpark = useCallback(
    (spark: string) => appendChat(spark, true),
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

  const openOfficialMedia = useCallback(() => {
    const targetUrl = roomState?.mediaUrl || watchUrl;
    if (!targetUrl) return;
    void openSecureServiceTab(targetUrl, effectiveService.accent).catch(() => {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    });
  }, [effectiveService.accent, openSecureServiceTab, roomState?.mediaUrl, watchUrl]);

  const togglePlayback = useCallback(() => {
    if (!isHost || !roomState || !videoRef.current) return;
    const next = !roomState.playing;
    if (next) {
      const start = videoRef.current.play();
      if (start) start.catch(() => {});
    } else {
      videoRef.current.pause();
    }
    publishRoomState({ playing: next, playhead: videoRef.current.currentTime });
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

  useEffect(() => {
    if (!selectedServiceId && session?.serviceId) {
      setSelectedServiceId(session.serviceId);
      localStorage.setItem(SERVICE_KEY, session.serviceId);
    }
  }, [selectedServiceId, session?.serviceId]);

  useEffect(() => {
    const knownPaths = new Set(["/services", "/auth", "/lobby", "/room"]);
    if (!knownPaths.has(currentPath)) {
      if (!selectedServiceId) navigate("/services", { replace: true });
      else if (!session) navigate("/auth", { replace: true });
      else if (roomState) navigate("/room", { replace: true });
      else navigate("/lobby", { replace: true });
      return;
    }

    if (!selectedServiceId && currentPath !== "/services") {
      navigate("/services", { replace: true });
      return;
    }
    if (selectedServiceId && !session && currentPath !== "/auth") {
      navigate("/auth", { replace: true });
      return;
    }
    if (selectedServiceId && session && !roomState && currentPath === "/room") {
      navigate("/lobby", { replace: true });
      return;
    }
  }, [currentPath, navigate, roomState, selectedServiceId, session]);

  useEffect(() => {
    if (selectedService.id !== "direct") return;
    if (serviceAuth.direct) return;
    patchServiceAuth("direct", true);
  }, [patchServiceAuth, selectedService.id, serviceAuth.direct]);

  useEffect(() => {
    if (activeTab === "tools" && !isHost) setActiveTab("chat");
  }, [activeTab, isHost]);

  useEffect(() => {
    if (!session || !roomState) {
      setRulesAccepted(false);
      return;
    }
    if (isHost) {
      setRulesAccepted(true);
      return;
    }
    setRulesAccepted(localStorage.getItem(rulesKey(roomState.roomCode, session.username)) === "1");
  }, [isHost, roomState, session]);

  useEffect(() => {
    if (!username) return;
    rememberProfile(username);
  }, [rememberProfile, username]);

  useEffect(() => {
    if (!session) return;
    const lastRoom = localStorage.getItem(lastRoomKey(session.username));
    if (!lastRoom) return;
    setRoomCode((current) => current || lastRoom);
    const loaded = normalizeRoomState(readJson<RoomState | null>(roomStorageKey(lastRoom), null));
    if (!loaded) return;
    if (loaded.leader === session.username || loaded.approvedUsers.includes(session.username) || !loaded.privateLobby) {
      setRoomState(loaded);
      setWatchUrl(loaded.mediaUrl);
      setMediaTitle(loaded.mediaTitle);
    }
  }, [session]);

  useEffect(() => {
    if (!roomKey) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== roomKey || !event.newValue) return;
      try {
        const incoming = normalizeRoomState(JSON.parse(event.newValue) as RoomState);
        if (!incoming) return;
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
      const loaded = normalizeRoomState(readJson<RoomState | null>(roomKey, null));
      if (!loaded) return;
      if (joinPending && session && loaded.approvedUsers.includes(session.username)) {
        setRoomState(loaded);
        setWatchUrl(loaded.mediaUrl);
        setMediaTitle(loaded.mediaTitle);
        setJoinPending(false);
        setAuthError("");
        rememberRoom(loaded.roomCode);
        pushLog(`Host approved ${session.username}`);
        navigate("/room");
      }
      setRoomState((current) => {
        if (!current) return current;
        if (loaded.updatedAt > current.updatedAt) return loaded;
        return current;
      });
    }, 900);
    return () => clearInterval(poll);
  }, [joinPending, pushLog, rememberRoom, roomKey, session, navigate]);

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

  useEffect(() => {
    if (!settings.autoSyncOnJoin || !roomState || isHost || !videoRef.current) return;
    const timer = window.setTimeout(() => {
      if (!videoRef.current) return;
      const expected =
        roomState.playhead + (roomState.playing ? (Date.now() - roomState.updatedAt) / 1000 : 0);
      videoRef.current.currentTime = Math.max(0, expected);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [isHost, roomState, settings.autoSyncOnJoin]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current !== null) window.clearTimeout(noticeTimeoutRef.current);
      if (achievementTimeoutRef.current !== null) window.clearTimeout(achievementTimeoutRef.current);
    };
  }, []);

  if (!selectedServiceId || currentPath === "/services") {
    return (
      <main className="service-root">
        <section className="service-card">
          <p className="route-pill">Step 1 / 4 • Service</p>
          <h1>Choose your streaming host</h1>
          <p className="subtle">
            Pick the service first. We then open its official sign-in in a secure in-app browser tab.
          </p>
          <div className="service-grid">
            {serviceCatalog.map((service) => (
              <button
                key={service.id}
                type="button"
                className="service-option"
                onClick={() => chooseService(service.id)}
                style={{ borderColor: `${service.accent}66` }}
              >
                <span className="service-tag" style={{ backgroundColor: service.accent }}>
                  {service.tag}
                </span>
                <strong>{service.name}</strong>
                <span>{service.legalHint}</span>
              </button>
            ))}
          </div>
          <p className="note">
            Industry pattern: each participant uses their own service account; no rebroadcasting.
          </p>
        </section>
      </main>
    );
  }

  if (!session || currentPath === "/auth") {
    return (
      <main className={`auth-root ${themeClass}`}>
        <section className="auth-card">
          <p className="route-pill">Step 2 / 4 • Authentication</p>
          <h1>KinoPulse Rooms</h1>
          <p className="subtle">
            Selected: <strong>{selectedService.name}</strong>. Secure in-app authentication starts below.
          </p>
          <section className="auth-browser-card">
            <div className="auth-browser-head">
              <h3>{selectedService.name} secure sign-in</h3>
              <span className={`chip ${serviceConnected ? "chip-safe" : ""}`}>
                {serviceConnected ? "Connected" : "Pending"}
              </span>
            </div>
            <p className="subtle">
              We open the official provider page in a secure browser tab. KinoPulse never captures your
              credentials.
            </p>
            <ol className="auth-steps">
              <li>Open official sign-in tab.</li>
              <li>Authenticate directly with {selectedService.name}.</li>
              <li>Return and confirm to continue profile login.</li>
            </ol>
            <div className="button-row">
              <button type="button" className="browser-cta" onClick={startServiceSignIn}>
                Open secure sign-in tab
              </button>
              <button
                type="button"
                onClick={confirmServiceSignIn}
                disabled={!authGuided && !serviceConnected}
              >
                I completed sign-in
              </button>
              <button type="button" onClick={openServiceCatalog}>
                Open {selectedService.name} home
              </button>
            </div>
            {authInfo && <p className="ok">{authInfo}</p>}
            <p className="note">
              Policy-safe pattern: official provider auth in system/custom tab, no embedded credential
              interception.
            </p>
          </section>
          {recentProfiles.length > 0 && (
            <div className="quick-profiles">
              {recentProfiles.map((profile) => (
                <button key={profile} type="button" className="profile-pill" onClick={() => loginRecentProfile(profile)}>
                  {profile}
                </button>
              ))}
            </div>
          )}
          <form className="report" onSubmit={handleAuthSubmit}>
            <label>
              Display name
              <input
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                placeholder="Leave blank for auto guest"
              />
            </label>
            {authError && <p className="warn">{authError}</p>}
            <div className="button-row">
              <button type="submit" disabled={!serviceConnected}>
                Continue
              </button>
              <button type="button" onClick={useQuickGuest} disabled={!serviceConnected}>
                Quick guest
              </button>
              <button type="button" onClick={resetServiceSelection}>
                Change service
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  const RoomComposer = (
    <section className="panel room-composer">
      <h2>Quick lobby</h2>
      <p className="subtle">
        Host: <strong>{selectedService.name}</strong> • {selectedService.legalHint}
      </p>
      <div className="auth-browser-card lobby-auth-card">
        <div className="auth-browser-head">
          <h3>Official account handoff</h3>
          <span className={`chip ${serviceConnected ? "chip-safe" : ""}`}>
            {serviceConnected ? "Signed in" : "Sign-in required"}
          </span>
        </div>
        <p className="subtle">
          Keep authentication and content selection in official service pages for policy compliance.
        </p>
        <div className="button-row">
          <button type="button" className="browser-cta" onClick={startServiceSignIn}>
            Open {selectedService.name} sign-in tab
          </button>
          <button type="button" onClick={openServiceCatalog}>
            Open service catalog
          </button>
          <button type="button" onClick={confirmServiceSignIn}>
            I finished sign-in
          </button>
        </div>
      </div>
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
        <button type="button" onClick={copyRoomCode}>
          Copy code
        </button>
        <button type="button" onClick={copyInvite}>
          Copy invite
        </button>
        <button type="button" onClick={pasteWatchUrlFromClipboard}>
          Paste link
        </button>
      </div>
      <label>
        Session title
        <input
          value={mediaTitle}
          onChange={(event) => setMediaTitle(event.target.value)}
          placeholder={`${selectedService.name} watch party`}
        />
      </label>
      <label>
        Watch link
        <input
          value={watchUrl}
          onChange={(event) => setWatchUrl(event.target.value)}
          placeholder={`https://${selectedService.domains[0]}`}
        />
      </label>
      {allowedDomainStatus === "allowed" && <p className="ok">Service domain validated.</p>}
      {allowedDomainStatus === "blocked" && (
        <p className="warn">
          Domain differs from selected service. Launch is blocked until link matches {selectedService.name}.
        </p>
      )}
      {allowedDomainStatus === "invalid" && <p className="warn">Invalid URL. Use full https:// link.</p>}
      {!serviceConnected && (
        <p className="warn">
          Complete {selectedService.name} sign-in in secure tab before launching or sharing room.
        </p>
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
      {notice && <p className="ok">{notice}</p>}
      <div className="button-row">
        <button disabled={launchDisabled} type="button" onClick={handleLaunchRoom}>
          Launch private room
        </button>
        <button type="button" onClick={handleJoinRoom}>
          Join room
        </button>
        <button type="button" onClick={handleJoinRoom} disabled={!roomKey}>
          One-tap rejoin
        </button>
      </div>
    </section>
  );

  const SettingsSheet = settingsOpen ? (
    <div className="sheet-backdrop" onClick={() => setSettingsOpen(false)}>
      <section className="sheet" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h3>Room settings</h3>
          <button type="button" onClick={() => setSettingsOpen(false)}>
            Close
          </button>
        </header>
        <div className="sheet-content">
          <section className="panel">
            <h3>Profile</h3>
            <p className="subtle">
              Logged in as <strong>{username}</strong>
            </p>
            <p className="subtle">
              Backend mode:{" "}
              <strong>{SUPABASE_CONFIGURED ? "Supabase realtime enabled" : "Local fallback mode"}</strong>
            </p>
            <div className="button-row">
              <button type="button" onClick={switchProfile}>
                Switch profile
              </button>
            </div>
          </section>

          <section className="panel">
            <h3>Streaming host</h3>
            <p className="subtle">
              Current auth state:{" "}
              <strong>{serviceConnected ? `${selectedService.name} connected` : "sign-in required"}</strong>
            </p>
            <div className="service-chip-row">
              {serviceCatalog.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`service-chip ${selectedService.id === service.id ? "active" : ""}`}
                  onClick={() => persistServiceChoice(service.id)}
                >
                  {service.name}
                </button>
              ))}
            </div>
            <div className="button-row">
              <button type="button" className="browser-cta" onClick={startServiceSignIn}>
                Open secure sign-in tab
              </button>
              <button type="button" onClick={confirmServiceSignIn}>
                Mark sign-in complete
              </button>
            </div>
          </section>

          {RoomComposer}

          <section className="panel legal">
            <h3>Legal hub</h3>
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
            <h3>Safety activity log</h3>
            <div className="setting-grid">
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.compactChat}
                  onChange={(event) => patchSettings({ compactChat: event.target.checked })}
                />
                Compact chat bubbles
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(event) => patchSettings({ reduceMotion: event.target.checked })}
                />
                Reduce motion effects
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.autoSyncOnJoin}
                  onChange={(event) => patchSettings({ autoSyncOnJoin: event.target.checked })}
                />
                Auto-sync immediately after joining
              </label>
            </div>
            <div className="chat-log">
              {moderationLog.map((event, index) => (
                <p key={`${event}-${index}`}>{event}</p>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  ) : null;

  if (currentPath === "/lobby" || !partyLive) {
    return (
      <main className={`app app-pre-room ${themeClass} ${settings.reduceMotion ? "reduce-motion" : ""}`}>
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />
        <section className="card pre-room-card">
          <header className="hero">
            <p className="route-pill">Step 3 / 4 • Lobby setup</p>
            <div className="hero-topline">
              <p className="eyebrow">KinoSpolu Labs • Pulse Social</p>
              <span className="hero-badge">Auto-login active for {username}</span>
            </div>
            <h1>KinoPulse Rooms</h1>
            <p className="lead">
              Pre-room mode keeps things simple: pick code, validate rights, and launch.
            </p>
            <div className="status-row">
              <span className="chip chip-live">Ready to launch</span>
              <span className="chip">Service: {selectedService.name}</span>
              <span className="chip">{SUPABASE_CONFIGURED ? "Supabase connected" : "Local mode active"}</span>
            </div>
          </header>
          <div className="pre-room-actions">
            <button type="button" onClick={() => setSettingsOpen(true)}>
              Open settings
            </button>
            <button type="button" onClick={switchProfile}>
              Switch profile
            </button>
          </div>
          {RoomComposer}
        </section>
        {SettingsSheet}
        {achievement && (
          <aside className="achievement-pop" role="status" aria-live="polite">
            <p className="achievement-title">{achievement.title}</p>
            <p className="achievement-body">{achievement.body}</p>
          </aside>
        )}
      </main>
    );
  }

  return (
    <main className={`app app-room ${themeClass} ${settings.reduceMotion ? "reduce-motion" : ""}`}>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <section className="room-shell">
        <header className="room-header">
          <p className="route-pill">Step 4 / 4 • Live room</p>
          <div className="hero-topline">
            <p className="eyebrow">KinoSpolu Labs • Pulse Social</p>
            <span className="hero-badge">Auto-login active for {username}</span>
          </div>
          <h1>KinoPulse Rooms</h1>
          <div className="status-row">
            <span className="chip chip-live">Room active</span>
            <span className="chip chip-safe">{syncHealth}</span>
            <span className="chip">Engagement: {engagementScore}</span>
            <span className="chip">Role: {isHost ? "Host" : "Viewer"}</span>
            <span className="chip">{roomState.privateLobby ? "Private lobby" : "Public lobby"}</span>
            <span className="chip">{SUPABASE_CONFIGURED ? "Supabase connected" : "Local mode active"}</span>
            {roomState.chatLocked && <span className="chip">Chat locked</span>}
            {roomState.slowModeSec > 0 && <span className="chip">Slow mode {roomState.slowModeSec}s</span>}
          </div>
          {roomState.announcement && <p className="announcement-banner">📣 {roomState.announcement}</p>}
          <div className="header-actions">
            <button type="button" onClick={() => setSettingsOpen(true)}>
              Settings
            </button>
            <button type="button" onClick={switchProfile}>
              Switch profile
            </button>
          </div>
        </header>

        <section className="sticky-video">
          <h2>Sync console</h2>
          <div className="sync-metrics">
            <MetricTile label="Playback" value={roomState.playing ? "Playing" : "Paused"} />
            <MetricTile label="Playhead" value={formatTime(videoRef.current?.currentTime ?? roomState.playhead)} />
            <MetricTile label="Latency" value="98ms" />
          </div>
          <video
            className="video-stage"
            ref={videoRef}
            src={inAppVideoUrl}
            preload="metadata"
            onTimeUpdate={handleVideoTimeUpdate}
          />
          {effectiveService.externalOnly && (
            <p className="subtle">
              {effectiveService.name} plays via official account flow. Preview is synced companion video.
            </p>
          )}
          <div className="button-row">
            <button type="button" onClick={togglePlayback} disabled={!isHost}>
              {roomState.playing ? "Pause (host)" : "Play (host)"}
            </button>
            <button type="button" onClick={() => seekBy(10)} disabled={!isHost}>
              +10s host
            </button>
            <button type="button" onClick={() => seekBy(-10)} disabled={!isHost}>
              -10s host
            </button>
            <button type="button" onClick={syncNow}>
              Sync now
            </button>
            <button type="button" onClick={openOfficialMedia}>
              Open {effectiveService.name}
            </button>
            <button type="button" onClick={startServiceSignIn}>
              Re-auth
            </button>
          </div>
        </section>

        <section className="tab-stage">
          {activeTab === "chat" && (
            <section className="panel tab-panel">
              <div className="panel-head">
                <h2>Social lounge</h2>
                <p className="subtle">Live room chat</p>
              </div>

              {!isHost && !rulesAccepted && (
                <div className="rules-gate">
                  <h3>Public room rules</h3>
                  <ul>
                    <li>No harassment, hate, or sexual content involving minors.</li>
                    <li>No spam, doxxing, or violent threats.</li>
                    <li>Respect copyright and platform policies.</li>
                  </ul>
                  <button type="button" onClick={acceptRules}>
                    I agree
                  </button>
                </div>
              )}

              <div className="participants">
                {participantProfiles.map((participant) => (
                  <span key={participant.name} className={`pill pill-${participant.mood}`}>
                    {participant.name}
                  </span>
                ))}
              </div>
              <div className={`chat-shell ${settings.compactChat ? "compact" : ""}`}>
                {chatMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
              <div className="quick-row">
                {quickSparkMessages.map((spark) => (
                  <button
                    key={spark}
                    type="button"
                    className="quick"
                    onClick={() => sendQuickSpark(spark)}
                    disabled={(!rulesAccepted && !isHost) || (!!roomState.chatLocked && !isHost)}
                  >
                    {spark}
                  </button>
                ))}
              </div>
              <form className="inline-form" onSubmit={handleSendChat}>
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Drop a message..."
                  disabled={(!rulesAccepted && !isHost) || (!!roomState.chatLocked && !isHost)}
                />
                <button type="submit" disabled={(!rulesAccepted && !isHost) || (!!roomState.chatLocked && !isHost)}>
                  Send
                </button>
              </form>
              {chatError && <p className="warn">{chatError}</p>}
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
          )}

          {activeTab === "participants" && (
            <section className="panel tab-panel">
              <div className="panel-head">
                <h2>Participants</h2>
                <p className="subtle">Roles, queue, and sync status</p>
              </div>
              <div className="participant-list">
                {participantList.map((entry) => (
                  <article key={entry.name} className="participant-item">
                    <div>
                      <strong>{entry.name}</strong>
                      <p className="subtle">{entry.role === "host" ? "Host" : "Viewer"}</p>
                    </div>
                    <span className="chip">{entry.name === username ? "You" : "Synced"}</span>
                  </article>
                ))}
              </div>
              {roomState.joinQueue.length > 0 && (
                <div className="queue-list">
                  <h3>Pending join requests</h3>
                  {roomState.joinQueue.map((requestUser) => (
                    <div key={requestUser} className="queue-item">
                      <span>@{requestUser}</span>
                      {isHost ? (
                        <div className="queue-actions">
                          <button type="button" onClick={() => approveJoinRequest(requestUser)}>
                            Approve
                          </button>
                          <button type="button" onClick={() => denyJoinRequest(requestUser)}>
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="subtle">Waiting for host</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "tools" && isHost && (
            <section className="panel tab-panel">
              <h2>Host & moderation tools</h2>
              <section className="queue-box">
                <h3>Private lobby controls</h3>
                <p className="subtle">Host has full pause/play/restart authority for everyone in room.</p>
                <div className="button-row">
                  <button type="button" onClick={togglePrivateLobby}>
                    {roomState.privateLobby ? "Disable private mode" : "Enable private mode"}
                  </button>
                  <button type="button" onClick={toggleLobbyLock}>
                    {roomState.locked ? "Unlock lobby" : "Lock lobby"}
                  </button>
                  <button type="button" onClick={toggleChatLock}>
                    {roomState.chatLocked ? "Unlock chat" : "Lock chat"}
                  </button>
                </div>
                <div className="slow-mode-row">
                  <button type="button" onClick={() => setSlowMode(0)}>
                    Slow off
                  </button>
                  <button type="button" onClick={() => setSlowMode(5)}>
                    Slow 5s
                  </button>
                  <button type="button" onClick={() => setSlowMode(10)}>
                    Slow 10s
                  </button>
                </div>
                <div className="host-playback-row">
                  <button type="button" onClick={pauseForAll}>
                    Pause all
                  </button>
                  <button type="button" onClick={playForAll}>
                    Play all
                  </button>
                  <button type="button" onClick={restartForAll}>
                    Restart 00:00
                  </button>
                </div>
                <div className="inline-form">
                  <input
                    value={announcementDraft}
                    onChange={(event) => setAnnouncementDraft(event.target.value)}
                    placeholder="Post announcement to all viewers..."
                  />
                  <button type="button" onClick={postAnnouncement}>
                    Announce
                  </button>
                </div>
                {roomState.announcement && (
                  <button type="button" onClick={clearAnnouncement}>
                    Clear announcement
                  </button>
                )}
                {roomState.joinQueue.length > 0 && (
                  <div className="queue-row-actions">
                    <button type="button" onClick={approveAllJoinRequests}>
                      Approve all
                    </button>
                    <button type="button" onClick={denyAllJoinRequests}>
                      Deny all
                    </button>
                  </div>
                )}
              </section>

              <section className="panel">
                <h3>Trust and moderation</h3>
                <ul>
                  <li>Host-only playback controls and private lobby approvals.</li>
                  <li>Report flow is available for harassment, hate, sexual, or copyright abuse.</li>
                  <li>Fast moderation actions include mute, remove, and blocklist.</li>
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
            </section>
          )}
        </section>

        <nav className="bottom-nav">
          <button
            type="button"
            className={activeTab === "chat" ? "active" : ""}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
          <button
            type="button"
            className={activeTab === "participants" ? "active" : ""}
            onClick={() => setActiveTab("participants")}
          >
            Participants
          </button>
          {isHost && (
            <button
              type="button"
              className={activeTab === "tools" ? "active" : ""}
              onClick={() => setActiveTab("tools")}
            >
              Host tools
            </button>
          )}
        </nav>
      </section>
      {SettingsSheet}
      {achievement && (
        <aside className="achievement-pop" role="status" aria-live="polite">
          <p className="achievement-title">{achievement.title}</p>
          <p className="achievement-body">{achievement.body}</p>
        </aside>
      )}
    </main>
  );
}

export default App;
