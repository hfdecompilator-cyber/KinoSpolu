import {
  ChangeEvent,
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { flushSync } from "react-dom";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient
} from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_PREFIX = "kinopulse.v4";
const SESSION_KEY = `${STORAGE_PREFIX}.session`;
const SETTINGS_KEY = `${STORAGE_PREFIX}.settings`;
const PROFILES_KEY = `${STORAGE_PREFIX}.profiles`;
const SERVICE_KEY = `${STORAGE_PREFIX}.service`;
const SERVICE_AUTH_KEY = `${STORAGE_PREFIX}.serviceAuth`;
const ACH_FIRST_ROOM_KEY = `${STORAGE_PREFIX}.achievement.firstRoom`;
const LOBBY_DRAFT_KEY = `${STORAGE_PREFIX}.lobbyDraft`;
const PROGRESS_SNAPSHOT_KEY = `${STORAGE_PREFIX}.progressSnapshot`;
const MANUAL_CHECKPOINT_KEY = `${STORAGE_PREFIX}.manualCheckpoint`;
const CUSTOM_EMOTICONS_KEY = `${STORAGE_PREFIX}.customEmoticons`;
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
const brandLogoPath = "/brand/kinopulse-logo.svg";
const popcornLogoPath = "/brand/popcorn-logo.svg";
type WakeLockHandle = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> };
};
type VideoWithPiP = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
};
type DocumentWithPiP = Document & {
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};
const supabaseClient: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null;

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
  emoticonSrc?: string;
};

type CustomEmoticon = {
  id: string;
  label: string;
  src: string;
};

type UserSettings = {
  compactChat: boolean;
  reduceMotion: boolean;
  autoSyncOnJoin: boolean;
  showTimestamps: boolean;
  cinematicButtons: boolean;
  highContrast: boolean;
  subtitlesEnabled: boolean;
  soundsEnabled: boolean;
  profanityFilter: boolean;
  keepScreenAwake: boolean;
};

type ProgressSnapshot = {
  selectedServiceId: string | null;
  serviceAuth: Record<string, boolean>;
  session: Session | null;
  roomCode: string;
  mediaTitle: string;
  watchUrl: string;
  rightsConfirmed: boolean;
  roomState: RoomState | null;
  settings: UserSettings;
  chatMessages: ChatMessage[];
  fireReactions: number;
  heartReactions: number;
  wowReactions: number;
  moderationLog: string[];
  blockedUsers: string[];
  customEmoticons: CustomEmoticon[];
  updatedAt: number;
};

type TabKey = "chat" | "participants" | "tools";
type RecentRoomCard = {
  roomCode: string;
  serviceId: string;
  serviceTag: string;
  serviceAccent: string;
  title: string;
  subtitle: string;
};

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
    domains: ["www.youtube.com", "youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"],
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
const fallbackRecentRooms: RecentRoomCard[] = [
  {
    roomCode: "FLIX87",
    serviceId: "netflix",
    serviceTag: "N",
    serviceAccent: "#e50914",
    title: "Netflix Watch Party",
    subtitle: "Tap rejoin if room is active"
  },
  {
    roomCode: "TUBE44",
    serviceId: "youtube",
    serviceTag: "YT",
    serviceAccent: "#ff0033",
    title: "YouTube Clips",
    subtitle: "Fast rejoin if host is live"
  }
];
const emojiPacks = [
  "🔥",
  "😂",
  "🤯",
  "👏",
  "💯",
  "🎉",
  "🫶",
  "😮‍💨",
  "👀",
  "🧠",
  "🍿",
  "✨",
  "🫡",
  "🚀"
];
const aiStyleEmoticons = ["(づ｡◕‿‿◕｡)づ", "ʕ•ᴥ•ʔ", "(ง •̀_•́)ง", "ヾ(•ω•`)o", "╰(*°▽°*)╯"];
const movieEmoticonSeeds = [
  { id: "movie-popcorn", label: "Popcorn", symbol: "🍿", bg: "#a02a2a", glow: "#f6c26f" },
  { id: "movie-ticket", label: "Shocked ticket", symbol: "🎫", bg: "#2c3d66", glow: "#8fc5ff" },
  { id: "movie-crying-reel", label: "Crying reel", symbol: "🎞️", bg: "#213047", glow: "#8ed8ff" },
  { id: "movie-action-clapper", label: "Action clapper", symbol: "🎬", bg: "#1f2937", glow: "#9ca3af" },
  { id: "movie-heart-camera", label: "Heart camera", symbol: "📹", bg: "#3a1b4d", glow: "#fda4af" },
  { id: "movie-rolling-video", label: "Rolling video", symbol: "📽️", bg: "#163659", glow: "#93c5fd" },
  { id: "movie-wow-glasses", label: "3D wow", symbol: "🤯", bg: "#1e3a8a", glow: "#60a5fa" },
  { id: "movie-popcorn-pop", label: "Popcorn pop", symbol: "💥", bg: "#7c2d12", glow: "#fdba74" },
  { id: "movie-recliner", label: "Recliner", symbol: "🛋️", bg: "#4c1d95", glow: "#c4b5fd" },
  { id: "movie-the-end", label: "The end", symbol: "🎞", bg: "#312e81", glow: "#c7d2fe" },
  { id: "movie-lens", label: "Watching lens", symbol: "📷", bg: "#0f766e", glow: "#99f6e4" },
  { id: "movie-scared-popcorn", label: "Scared popcorn", symbol: "😱", bg: "#7f1d1d", glow: "#fca5a5" }
] as const;

const movieEmoticonDataUri = (symbol: string, label: string, bg: string, glow: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="#0b1320" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="20" fill="url(#g)" stroke="${glow}" stroke-width="2"/>
      <circle cx="48" cy="26" r="11" fill="${glow}" opacity="0.2" />
      <text x="48" y="58" text-anchor="middle" dominant-baseline="middle" font-size="36">${symbol}</text>
      <text x="48" y="82" text-anchor="middle" font-size="10" fill="${glow}" font-family="Inter,Arial,sans-serif">${label}</text>
    </svg>`
  )}`;

const builtInMovieEmoticons: CustomEmoticon[] = movieEmoticonSeeds.map((entry) => ({
  id: entry.id,
  label: entry.label,
  src: movieEmoticonDataUri(entry.symbol, entry.label, entry.bg, entry.glow)
}));

const mergeWithMoviePack = (entries: CustomEmoticon[]) => {
  const safeCustom = entries
    .filter((entry) => entry && typeof entry.id === "string" && typeof entry.label === "string")
    .filter((entry) => typeof entry.src === "string" && entry.src.startsWith("data:image/"))
    .filter((entry) => !entry.id.startsWith("movie-"))
    .slice(0, 12);
  return [...builtInMovieEmoticons, ...safeCustom].slice(0, 18);
};

const defaultSettings: UserSettings = {
  compactChat: false,
  reduceMotion: false,
  autoSyncOnJoin: true,
  showTimestamps: true,
  cinematicButtons: true,
  highContrast: false,
  subtitlesEnabled: true,
  soundsEnabled: true,
  profanityFilter: false,
  keepScreenAwake: false
};

const roomStorageKey = (roomCode: string) => `${STORAGE_PREFIX}.room.${roomCode}`;
const roomChatKey = (roomCode: string) => `${STORAGE_PREFIX}.chat.${roomCode}`;
const roomReactionKey = (roomCode: string) => `${STORAGE_PREFIX}.reactions.${roomCode}`;
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

const formatStamp = (value: number | null) => {
  if (!value) return "No checkpoint yet";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const firstUrlFromText = (value: string) => {
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? "";
};

const extractYouTubeWatchUrl = (value: string): string | null => {
  const candidate = firstUrlFromText(value.trim()) || value.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }
    if (!host.includes("youtube.com")) return null;
    if (parsed.pathname.startsWith("/watch")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments[0] === "shorts" || segments[0] === "live") {
      const id = segments[1];
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const extractServiceUrl = (value: string, domains: string[]) => {
  const candidate = firstUrlFromText(value.trim()) || value.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (domains.includes(parsed.hostname.toLowerCase())) return parsed.toString();
    return null;
  } catch {
    return null;
  }
};

const toYouTubeEmbedUrl = (value: string) => {
  const normalized = extractYouTubeWatchUrl(value);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    const id = parsed.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
};

const isLikelyDirectPlayableUrl = (value: string) => {
  const candidate = value.trim();
  if (!candidate) return false;
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("commondatastorage.googleapis.com")) return true;
    return /\.(mp4|webm|m3u8|mov|ogg)(\?.*)?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

const sanitizeProfanity = (value: string) =>
  value
    .replace(/\b(fuck|shit|bitch|asshole)\b/gi, "***")
    .replace(/\s{2,}/g, " ")
    .trim();

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

const ChatBubble = memo(function ChatBubble({
  message,
  showTimestamp
}: {
  message: ChatMessage;
  showTimestamp: boolean;
}) {
  return (
    <article className={`bubble ${message.own ? "own" : ""}`}>
      <p className="bubble-meta">
        <strong>{message.user}</strong>
        {showTimestamp && <span>{message.at}</span>}
      </p>
      {message.emoticonSrc && (
        <img
          src={message.emoticonSrc}
          alt={message.text || "custom emoticon"}
          className="bubble-emoticon"
          loading="lazy"
        />
      )}
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
  const [settings, setSettings] = useState<UserSettings>(() => ({
    ...defaultSettings,
    ...readJson<Partial<UserSettings>>(SETTINGS_KEY, {})
  }));

  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authGuided, setAuthGuided] = useState(false);
  const [authInfo, setAuthInfo] = useState("");
  const [authAutoStartServiceId, setAuthAutoStartServiceId] = useState<string | null>(null);
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [homeServiceId, setHomeServiceId] = useState<string>(() =>
    localStorage.getItem(SERVICE_KEY) || "netflix"
  );

  const [lobbyDraftSeed] = useState(() =>
    readJson<{
      roomCode: string;
      mediaTitle: string;
      watchUrl: string;
      rightsConfirmed: boolean;
    }>(LOBBY_DRAFT_KEY, {
      roomCode: "",
      mediaTitle: "",
      watchUrl: SAMPLE_VIDEO,
      rightsConfirmed: false
    })
  );
  const [roomCode, setRoomCode] = useState(lobbyDraftSeed.roomCode || "");
  const [mediaTitle, setMediaTitle] = useState(lobbyDraftSeed.mediaTitle || "");
  const [watchUrl, setWatchUrl] = useState(lobbyDraftSeed.watchUrl || SAMPLE_VIDEO);
  const [rightsConfirmed, setRightsConfirmed] = useState(!!lobbyDraftSeed.rightsConfirmed);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [joinPending, setJoinPending] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [autoJoinRoomCode, setAutoJoinRoomCode] = useState<string | null>(null);

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
  const [customEmoticons, setCustomEmoticons] = useState<CustomEmoticon[]>(() =>
    mergeWithMoviePack(readJson<CustomEmoticon[]>(CUSTOM_EMOTICONS_KEY, []))
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [achievement, setAchievement] = useState<{ title: string; body: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(settings.subtitlesEnabled);
  const [voiceTipsOpen, setVoiceTipsOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<"fallback" | "checking" | "healthy" | "degraded">(
    SUPABASE_CONFIGURED ? "checking" : "fallback"
  );
  const [lastCheckpointAt, setLastCheckpointAt] = useState<number | null>(() =>
    readJson<ProgressSnapshot | null>(PROGRESS_SNAPSHOT_KEY, null)?.updatedAt ?? null
  );
  const [lastManualCheckpointAt, setLastManualCheckpointAt] = useState<number | null>(() =>
    readJson<ProgressSnapshot | null>(MANUAL_CHECKPOINT_KEY, null)?.updatedAt ?? null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const lastHostPublishRef = useRef(0);
  const lastGuestChatRef = useRef(0);
  const noticeTimeoutRef = useRef<number | null>(null);
  const achievementTimeoutRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockHandle | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const importBackupRef = useRef<HTMLInputElement | null>(null);
  const emoticonUploadRef = useRef<HTMLInputElement | null>(null);
  const pendingBrowserActionRef = useRef<{ serviceId: string; mode: "signin" | "catalog" } | null>(null);
  const browserLaunchAtRef = useRef(0);

  const selectedService = useMemo(
    () => getServiceById(selectedServiceId || session?.serviceId),
    [selectedServiceId, session?.serviceId]
  );
  const homeSelectedService = useMemo(() => getServiceById(homeServiceId), [homeServiceId]);
  const themeClass = `theme-${selectedService.id}`;
  const serviceConnected = selectedService.id === "direct" || !!serviceAuth[selectedService.id];
  const currentPath = location.pathname || "/";
  const hasUploadedEmoticons = useMemo(
    () => customEmoticons.some((entry) => !entry.id.startsWith("movie-")),
    [customEmoticons]
  );

  const username = session?.username ?? "";
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const roomKey = normalizedRoomCode ? roomStorageKey(normalizedRoomCode) : "";
  const voiceRoomUrl = `https://meet.jit.si/kinopulse-${(normalizedRoomCode || "lobby").toLowerCase()}`;
  const backendLabel =
    backendHealth === "fallback"
      ? "Local mode active"
      : backendHealth === "healthy"
      ? "Supabase connected"
      : backendHealth === "checking"
      ? "Supabase checking"
      : "Supabase degraded";
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

  const effectiveService = useMemo(
    () => getServiceById(roomState?.serviceId || selectedService.id),
    [roomState?.serviceId, selectedService.id]
  );

  const roomWatchUrl = roomState?.mediaUrl || watchUrl;
  const roomYouTubeEmbedUrl = useMemo(() => {
    if (effectiveService.id !== "youtube") return null;
    return toYouTubeEmbedUrl(roomWatchUrl);
  }, [effectiveService.id, roomWatchUrl]);
  const useNativeVideoPlayer = !effectiveService.externalOnly;
  const inAppVideoUrl = useMemo(() => {
    if (!roomState) return SAMPLE_VIDEO;
    if (!useNativeVideoPlayer) return "";
    return roomState.mediaUrl || SAMPLE_VIDEO;
  }, [roomState, useNativeVideoPlayer]);

  const lobbyPreviewUrl = useMemo(() => {
    if (selectedService.externalOnly) return SAMPLE_VIDEO;
    return watchUrl.trim() || SAMPLE_VIDEO;
  }, [selectedService.externalOnly, watchUrl]);

  const youtubeEmbedPreview = useMemo(() => {
    if (selectedService.id !== "youtube") return null;
    return toYouTubeEmbedUrl(watchUrl);
  }, [selectedService.id, watchUrl]);

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

  const recentRoomCards = useMemo<RecentRoomCard[]>(() => {
    const usernames = Array.from(new Set([session?.username, ...recentProfiles].filter(Boolean))) as string[];
    const knownCodes = usernames
      .map((name) => localStorage.getItem(lastRoomKey(name)))
      .filter((value): value is string => !!value)
      .map((value) => value.trim().toUpperCase());
    const dedupCodes = Array.from(new Set(knownCodes));
    const mapped = dedupCodes
      .map((code) => {
        const room = normalizeRoomState(readJson<RoomState | null>(roomStorageKey(code), null));
        if (!room) return null;
        const roomService = getServiceById(room.serviceId);
        return {
          roomCode: code,
          serviceId: roomService.id,
          serviceTag: roomService.tag,
          serviceAccent: roomService.accent,
          title: room.mediaTitle || `${roomService.name} Watch Party`,
          subtitle: `${roomService.name} • ${code}`
        } satisfies RecentRoomCard;
      })
      .filter((entry): entry is RecentRoomCard => !!entry)
      .slice(0, 4);
    return mapped.length ? mapped : fallbackRecentRooms;
  }, [recentProfiles, session?.username]);

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
  const launchBlockReason = !session
    ? "Complete profile login first."
    : !serviceConnected
    ? `Connect ${selectedService.name} first.`
    : !normalizedRoomCode
    ? "Add a room code."
    : !domainCompliant
    ? `Use a valid ${selectedService.name} link.`
    : !rightsConfirmed
    ? "Confirm rights to enable launch."
    : "";

  const flashNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const captureProgressSnapshot = useCallback(
    (updatedAt = Date.now()): ProgressSnapshot => ({
      selectedServiceId,
      serviceAuth,
      session,
      roomCode,
      mediaTitle,
      watchUrl,
      rightsConfirmed,
      roomState,
      settings,
      chatMessages,
      fireReactions,
      heartReactions,
      wowReactions,
      moderationLog,
      blockedUsers,
      customEmoticons,
      updatedAt
    }),
    [
      blockedUsers,
      chatMessages,
      customEmoticons,
      fireReactions,
      heartReactions,
      mediaTitle,
      moderationLog,
      rightsConfirmed,
      roomCode,
      roomState,
      selectedServiceId,
      serviceAuth,
      session,
      settings,
      watchUrl,
      wowReactions
    ]
  );

  const saveProgressSnapshot = useCallback(
    (mode: "auto" | "manual" = "auto") => {
      const updatedAt = Date.now();
      const snapshot = captureProgressSnapshot(updatedAt);
      writeJson(PROGRESS_SNAPSHOT_KEY, snapshot);
      setLastCheckpointAt(updatedAt);
      if (mode === "manual") {
        writeJson(MANUAL_CHECKPOINT_KEY, snapshot);
        setLastManualCheckpointAt(updatedAt);
        flashNotice("Progress checkpoint saved.");
      }
      return snapshot;
    },
    [captureProgressSnapshot, flashNotice]
  );

  const applyProgressSnapshot = useCallback(
    (incoming: ProgressSnapshot, source: string) => {
      const safeSettings = { ...defaultSettings, ...(incoming.settings || {}) };
      const safeServiceAuth = Object.fromEntries(
        Object.entries(incoming.serviceAuth || {}).filter((entry) => typeof entry[1] === "boolean")
      ) as Record<string, boolean>;
      const safeMessages = Array.isArray(incoming.chatMessages)
        ? incoming.chatMessages
            .filter((entry) => entry && typeof entry.text === "string" && typeof entry.user === "string")
            .slice(-90)
        : [];
      const safeRoomState = normalizeRoomState(incoming.roomState);
      const safeUpdatedAt = typeof incoming.updatedAt === "number" ? incoming.updatedAt : Date.now();

      setSelectedServiceId(incoming.selectedServiceId || null);
      if (incoming.selectedServiceId) localStorage.setItem(SERVICE_KEY, incoming.selectedServiceId);
      else localStorage.removeItem(SERVICE_KEY);

      setServiceAuth(safeServiceAuth);
      writeJson(SERVICE_AUTH_KEY, safeServiceAuth);

      setSession(incoming.session || null);
      if (incoming.session) writeJson(SESSION_KEY, incoming.session);
      else localStorage.removeItem(SESSION_KEY);

      setRoomCode(incoming.roomCode || "");
      setMediaTitle(incoming.mediaTitle || "");
      setWatchUrl(incoming.watchUrl || SAMPLE_VIDEO);
      setRightsConfirmed(!!incoming.rightsConfirmed);
      writeJson(LOBBY_DRAFT_KEY, {
        roomCode: incoming.roomCode || "",
        mediaTitle: incoming.mediaTitle || "",
        watchUrl: incoming.watchUrl || SAMPLE_VIDEO,
        rightsConfirmed: !!incoming.rightsConfirmed
      });

      setSettings(safeSettings);
      writeJson(SETTINGS_KEY, safeSettings);
      setCaptionsOn(safeSettings.subtitlesEnabled);

      setChatMessages(safeMessages);
      setFireReactions(Math.max(0, incoming.fireReactions || 0));
      setHeartReactions(Math.max(0, incoming.heartReactions || 0));
      setWowReactions(Math.max(0, incoming.wowReactions || 0));
      setBlockedUsers(Array.isArray(incoming.blockedUsers) ? incoming.blockedUsers : []);
      const safeCustomEmoticons = mergeWithMoviePack(
        Array.isArray(incoming.customEmoticons) ? incoming.customEmoticons : []
      );
      setCustomEmoticons(safeCustomEmoticons);
      writeJson(CUSTOM_EMOTICONS_KEY, safeCustomEmoticons);
      setModerationLog(
        [`Restored from ${source}`, ...(Array.isArray(incoming.moderationLog) ? incoming.moderationLog : [])].slice(
          0,
          18
        )
      );

      setRoomState(safeRoomState);
      if (safeRoomState?.roomCode) {
        writeJson(roomStorageKey(safeRoomState.roomCode), safeRoomState);
        writeJson(roomChatKey(safeRoomState.roomCode), safeMessages);
        writeJson(roomReactionKey(safeRoomState.roomCode), {
          fireReactions: Math.max(0, incoming.fireReactions || 0),
          heartReactions: Math.max(0, incoming.heartReactions || 0),
          wowReactions: Math.max(0, incoming.wowReactions || 0)
        });
      }

      writeJson(PROGRESS_SNAPSHOT_KEY, { ...incoming, updatedAt: safeUpdatedAt });
      setLastCheckpointAt(safeUpdatedAt);

      if (safeRoomState && incoming.session) navigate("/room");
      else if (incoming.session) navigate("/lobby");
      else if (incoming.selectedServiceId) navigate("/auth");
      else navigate("/services");
    },
    [navigate]
  );

  const restoreLastCheckpoint = useCallback(() => {
    const manual = readJson<ProgressSnapshot | null>(MANUAL_CHECKPOINT_KEY, null);
    const snapshot = manual ?? readJson<ProgressSnapshot | null>(PROGRESS_SNAPSHOT_KEY, null);
    if (!snapshot) {
      flashNotice("No checkpoint found yet.");
      return;
    }
    applyProgressSnapshot(snapshot, manual ? "manual checkpoint" : "latest auto-checkpoint");
    flashNotice("Checkpoint restored.");
  }, [applyProgressSnapshot, flashNotice]);

  const exportBackup = useCallback(() => {
    const snapshot = saveProgressSnapshot("auto");
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kinopulse-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    flashNotice("Backup exported.");
  }, [flashNotice, saveProgressSnapshot]);

  const openImportBackupPicker = useCallback(() => {
    importBackupRef.current?.click();
  }, []);

  const importBackupFromFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as ProgressSnapshot;
        applyProgressSnapshot(parsed, `backup file (${file.name})`);
        writeJson(MANUAL_CHECKPOINT_KEY, parsed);
        setLastManualCheckpointAt(typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now());
        flashNotice("Backup imported and restored.");
      } catch {
        flashNotice("Invalid backup file.");
      } finally {
        event.target.value = "";
      }
    },
    [applyProgressSnapshot, flashNotice]
  );

  const openEmoticonUploadPicker = useCallback(() => {
    emoticonUploadRef.current?.click();
  }, []);

  const importCustomEmoticonFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, 6);
      if (!imageFiles.length) {
        flashNotice("Select image files for custom emoticons.");
        event.target.value = "";
        return;
      }
      try {
        const encoded = await Promise.all(
          imageFiles.map(
            (file) =>
              new Promise<CustomEmoticon>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  resolve({
                    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    label: file.name.replace(/\.[^/.]+$/, "").slice(0, 18) || "custom",
                    src: String(reader.result || "")
                  });
                reader.onerror = () => reject(new Error("read-failed"));
                reader.readAsDataURL(file);
              })
          )
        );
        const safe = encoded.filter((entry) => entry.src.startsWith("data:image/"));
        if (!safe.length) {
          flashNotice("Could not read selected images.");
          return;
        }
        setCustomEmoticons((current) => {
          const customOnlyCurrent = current.filter((entry) => !entry.id.startsWith("movie-"));
          const merged = mergeWithMoviePack([...safe, ...customOnlyCurrent]);
          writeJson(CUSTOM_EMOTICONS_KEY, merged);
          return merged;
        });
        flashNotice(`${safe.length} custom emoticon${safe.length > 1 ? "s" : ""} added.`);
      } catch {
        flashNotice("Could not import custom emoticons.");
      } finally {
        event.target.value = "";
      }
    },
    [flashNotice]
  );

  const clearCustomEmoticons = useCallback(() => {
    setCustomEmoticons(builtInMovieEmoticons);
    writeJson(CUSTOM_EMOTICONS_KEY, builtInMovieEmoticons);
    flashNotice("Uploaded emoticons cleared. Movie pack kept.");
  }, [flashNotice]);

  const pushLog = useCallback((event: string) => {
    setModerationLog((current) => [event, ...current].slice(0, 18));
  }, []);

  const playUiPop = useCallback(() => {
    if (!settings.soundsEnabled) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(620, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(860, context.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.01, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
    } catch {
      return;
    }
  }, [settings.soundsEnabled]);

  const sendRealtimeEvent = useCallback((event: string, payload: unknown) => {
    const channel = roomChannelRef.current;
    if (!channel) return;
    void channel.send({
      type: "broadcast",
      event,
      payload
    });
  }, []);

  const appendChat = useCallback(
    (
      text: string,
      own: boolean,
      shouldBroadcast = false,
      senderOverride?: string,
      emoticonSrc?: string
    ) => {
      const clean = text.trim();
      if (!clean && !emoticonSrc) return;
      const message: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        user: senderOverride || (own ? username || "You" : "System"),
        text: clean || "sent an emoticon",
        own,
        at: getClock(),
        emoticonSrc
      };
      setChatMessages((current) => [...current, message].slice(-90));
      if (shouldBroadcast) {
        sendRealtimeEvent("chat_message", message);
      }
    },
    [sendRealtimeEvent, username]
  );

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
    setAuthAutoStartServiceId(null);
    navigate("/services");
  }, [navigate]);

  const publishRoomState = useCallback(
    (next: Partial<RoomState>) => {
      setRoomState((current) => {
        if (!current || !roomKey) return current;
        const merged: RoomState = { ...current, ...next, updatedAt: Date.now() };
        writeJson(roomKey, merged);
        sendRealtimeEvent("room_state", merged);
        return merged;
      });
    },
    [roomKey, sendRealtimeEvent]
  );

  const unlockAchievement = useCallback((title: string, body: string) => {
    setAchievement({ title, body });
    if (achievementTimeoutRef.current !== null) window.clearTimeout(achievementTimeoutRef.current);
    achievementTimeoutRef.current = window.setTimeout(() => setAchievement(null), 2800);
  }, []);

  const chooseService = useCallback((serviceId: string) => {
    persistServiceChoice(serviceId);
    if (serviceId === "direct") {
      setWatchUrl((current) => (isLikelyDirectPlayableUrl(current) ? current : SAMPLE_VIDEO));
      setMediaTitle((current) => (current.trim() ? current : "Licensed direct watch party"));
      setRightsConfirmed(true);
    }
    setAuthError("");
    setAuthGuided(false);
    setAuthInfo("");
    const alreadyConnected = serviceId === "direct" || !!serviceAuth[serviceId];
    if (session && alreadyConnected) {
      navigate("/lobby");
      return;
    }
    setAuthAutoStartServiceId(serviceId);
    navigate("/auth");
  }, [navigate, persistServiceChoice, serviceAuth, session]);

  const startRoomFromHome = useCallback(() => {
    chooseService(homeServiceId);
  }, [chooseService, homeServiceId]);

  const pasteRoomCodeFromClipboard = useCallback(async () => {
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
      const normalized = clipped.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 18);
      if (!normalized) {
        flashNotice("No valid room code found in clipboard.");
        return;
      }
      setRoomCode(normalized);
      flashNotice("Room code pasted.");
    } catch {
      flashNotice("Could not read clipboard.");
    }
  }, [flashNotice]);

  const runQuickJoinFromHome = useCallback(
    (targetRoomCode?: string) => {
      const candidate = (targetRoomCode || roomCode).trim().toUpperCase();
      if (!candidate) {
        flashNotice("Enter a room code first.");
        return;
      }
      const loaded = normalizeRoomState(readJson<RoomState | null>(roomStorageKey(candidate), null));
      if (!loaded) {
        flashNotice("Room not found on this device yet. Ask host to share active invite/code.");
        return;
      }
      setRoomCode(candidate);
      setMediaTitle(loaded.mediaTitle);
      setWatchUrl(loaded.mediaUrl);
      setRightsConfirmed(true);
      persistServiceChoice(loaded.serviceId);
      setAutoJoinRoomCode(candidate);
      if (!session) {
        setAuthInfo(`Fast sign-in then auto-joining room ${candidate}.`);
        navigate("/auth");
        return;
      }
      navigate("/lobby");
    },
    [flashNotice, navigate, persistServiceChoice, roomCode, session]
  );

  const rejoinRecentRoom = useCallback(
    (room: RecentRoomCard) => {
      runQuickJoinFromHome(room.roomCode);
    },
    [runQuickJoinFromHome]
  );

  const autoContinueToLobby = useCallback(
    (preferredName?: string) => {
      if (!selectedService.id) return "";
      const fromPreferred = preferredName?.trim();
      const fromDraft = authName.trim();
      const fromSession = session?.username?.trim();
      const fromRecent = recentProfiles[0]?.trim();
      const fallbackGuest = `Guest${Math.floor(Math.random() * 900 + 100)}`;
      const nextName = fromPreferred || fromDraft || fromSession || fromRecent || fallbackGuest;
      persistSession({ username: nextName, serviceId: selectedService.id });
      rememberProfile(nextName);
      setAuthName("");
      setAuthError("");
      if (currentPath === "/auth") navigate("/lobby");
      return nextName;
    },
    [
      authName,
      currentPath,
      navigate,
      persistSession,
      recentProfiles,
      rememberProfile,
      selectedService.id,
      session?.username
    ]
  );

  const recommendedAuthProfile = useMemo(
    () => session?.username?.trim() || recentProfiles[0]?.trim() || "Guest",
    [recentProfiles, session?.username]
  );

  const continueInstantly = useCallback(() => {
    const who = autoContinueToLobby();
    flashNotice(`Continuing as ${who}.`);
  }, [autoContinueToLobby, flashNotice]);

  const detectServiceLinkFromClipboard = useCallback(
    async (serviceId: string) => {
      if (!navigator.clipboard?.readText) return null;
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (!text) return null;
        const service = getServiceById(serviceId);
        const detected =
          service.id === "youtube"
            ? extractYouTubeWatchUrl(text)
            : extractServiceUrl(text, service.domains);
        if (!detected) return null;
        setWatchUrl(detected);
        setRightsConfirmed(true);
        setMediaTitle((current) =>
          current.trim() || (service.id === "youtube" ? "YouTube Watch Party" : `${service.name} watch party`)
        );
        return detected;
      } catch {
        return null;
      }
    },
    []
  );

  const handleBrowserReturn = useCallback(async () => {
    const pending = pendingBrowserActionRef.current;
    if (!pending) return;
    pendingBrowserActionRef.current = null;

    const service = getServiceById(pending.serviceId);
    const detectedUrl = await detectServiceLinkFromClipboard(service.id);

    if (pending.mode === "signin") {
      patchServiceAuth(service.id, true);
      setAuthGuided(true);
      setAuthInfo(
        `${service.name} tab closed. Connected automatically on this device${
          detectedUrl ? " and video link detected from clipboard." : "."
        }`
      );
      if (currentPath === "/auth") {
        const who = autoContinueToLobby();
        flashNotice(`${service.name} ready. Continuing as ${who}.`);
      }
      return;
    }

    if (detectedUrl) {
      flashNotice(`${service.name} video link detected from clipboard.`);
      if (currentPath !== "/room") navigate("/lobby");
      return;
    }

    flashNotice(`${service.name} tab closed. Copy a video URL for instant handoff.`);
  }, [
    autoContinueToLobby,
    currentPath,
    detectServiceLinkFromClipboard,
    flashNotice,
    navigate,
    patchServiceAuth
  ]);

  const startServiceSignIn = useCallback(async () => {
    setAuthAutoStartServiceId(null);
    if (selectedService.id === "direct") {
      patchServiceAuth("direct", true);
      setAuthGuided(true);
      setAuthInfo("Direct URL mode is account-free. Auto-continuing.");
      if (currentPath === "/auth") {
        const who = autoContinueToLobby();
        flashNotice(`Direct mode ready. Continuing as ${who}.`);
      }
      return;
    }
    try {
      pendingBrowserActionRef.current = { serviceId: selectedService.id, mode: "signin" };
      browserLaunchAtRef.current = Date.now();
      await openSecureServiceTab(selectedService.loginUrl, selectedService.accent);
      setAuthGuided(true);
      setAuthInfo(
        selectedService.id === "youtube"
          ? "Google/YouTube sign-in tab opened. After sign-in, open a video and copy link. Returning auto-continues."
          : `Secure ${selectedService.name} tab opened. Sign in there and return. We'll auto-continue.`
      );
    } catch {
      pendingBrowserActionRef.current = null;
      setAuthInfo("Could not open sign-in tab. Try again.");
    }
  }, [
    autoContinueToLobby,
    currentPath,
    flashNotice,
    openSecureServiceTab,
    patchServiceAuth,
    setAuthAutoStartServiceId,
    selectedService.accent,
    selectedService.id,
    selectedService.loginUrl,
    selectedService.name
  ]);

  const confirmServiceSignIn = useCallback(() => {
    patchServiceAuth(selectedService.id, true);
    setAuthGuided(true);
    setAuthInfo(`${selectedService.name} sign-in marked complete. Auto-continuing.`);
    if (currentPath === "/auth") {
      const who = autoContinueToLobby();
      flashNotice(`${selectedService.name} connected. Continuing as ${who}.`);
      return;
    }
    flashNotice(`${selectedService.name} connected for this profile.`);
  }, [
    autoContinueToLobby,
    currentPath,
    flashNotice,
    patchServiceAuth,
    selectedService.id,
    selectedService.name
  ]);

  const openServiceCatalog = useCallback(async () => {
    const target =
      selectedService.id === "direct"
        ? watchUrl || SAMPLE_VIDEO
        : selectedService.browseUrl;
    try {
      pendingBrowserActionRef.current = { serviceId: selectedService.id, mode: "catalog" };
      browserLaunchAtRef.current = Date.now();
      await openSecureServiceTab(target, selectedService.accent);
      flashNotice(
        selectedService.id === "youtube"
          ? "YouTube opened. Copy a video URL there; returning can auto-fill lobby."
          : `${selectedService.name} opened in secure tab.`
      );
    } catch {
      pendingBrowserActionRef.current = null;
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
      const detected =
        selectedService.id === "youtube"
          ? extractYouTubeWatchUrl(clipped)
          : extractServiceUrl(clipped, selectedService.domains) || clipped;
      if (!detected) {
        flashNotice(`No valid ${selectedService.name} link found in clipboard.`);
        return;
      }
      setWatchUrl(detected);
      setRightsConfirmed(true);
      if (selectedService.id === "youtube") {
        setMediaTitle((current) => current.trim() || "YouTube Watch Party");
      }
      flashNotice("Watch link pasted from clipboard.");
    } catch {
      flashNotice("Clipboard read failed. Paste manually.");
    }
  }, [flashNotice, selectedService.domains, selectedService.id, selectedService.name]);

  const handleAuthSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!selectedService.id) return;
      if (!serviceConnected) {
        setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
        return;
      }
      const nextName = autoContinueToLobby(authName.trim());
      unlockAchievement("Profile Ready", `${nextName} connected to ${selectedService.name}`);
    },
    [
      authName,
      autoContinueToLobby,
      selectedService.id,
      selectedService.name,
      serviceConnected,
      unlockAchievement
    ]
  );

  const useQuickGuest = useCallback(() => {
    if (!selectedService.id) return;
    if (!serviceConnected) {
      setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
      return;
    }
    const name = `Guest${Math.floor(Math.random() * 900 + 100)}`;
    autoContinueToLobby(name);
    unlockAchievement("Quick Entry", `${name} joined instantly`);
  }, [
    autoContinueToLobby,
    selectedService.id,
    selectedService.name,
    serviceConnected,
    unlockAchievement
  ]);

  const loginRecentProfile = useCallback(
    (profile: string) => {
      if (!selectedService.id) return;
      if (!serviceConnected) {
        setAuthError(`Sign in to ${selectedService.name} in the secure tab first.`);
        return;
      }
      autoContinueToLobby(profile);
    },
    [autoContinueToLobby, selectedService.id, selectedService.name, serviceConnected]
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

  const copyCurrentRoomUrl = useCallback(() => {
    const target = roomState?.mediaUrl || watchUrl;
    if (!target.trim()) {
      flashNotice("No room URL available yet.");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      flashNotice("Clipboard unavailable on this device.");
      return;
    }
    void navigator.clipboard
      .writeText(target)
      .then(() => flashNotice("Room URL copied."))
      .catch(() => flashNotice("Could not copy room URL."));
  }, [flashNotice, roomState?.mediaUrl, watchUrl]);

  const openSettingsPage = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  const openAccountPage = useCallback(() => {
    navigate("/account");
  }, [navigate]);

  const returnToPrimaryPage = useCallback(() => {
    navigate(roomState ? "/room" : "/lobby");
  }, [navigate, roomState]);

  const saveAccountName = useCallback(() => {
    if (!session) return;
    const next = accountNameDraft.trim().slice(0, 24);
    if (!next) {
      flashNotice("Display name cannot be empty.");
      return;
    }
    persistSession({ ...session, username: next });
    rememberProfile(next);
    if (roomState?.leader === session.username) {
      publishRoomState({
        leader: next,
        approvedUsers: roomState.approvedUsers.map((entry) => (entry === session.username ? next : entry))
      });
    }
    flashNotice(`Profile updated to ${next}.`);
  }, [accountNameDraft, flashNotice, persistSession, publishRoomState, rememberProfile, roomState, session]);

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
    flushSync(() => {
      setRoomState(state);
      setWatchUrl(state.mediaUrl);
      setMediaTitle(state.mediaTitle);
    });
    sendRealtimeEvent("room_state", state);
    setJoinPending(false);
    setRulesAccepted(true);
    rememberRoom(state.roomCode);
    appendChat("Room is now live. Everyone syncing in...", false, true, "System");
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
    sendRealtimeEvent,
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
      flushSync(() => {
        setRoomState(loaded);
        setWatchUrl(loaded.mediaUrl);
        setMediaTitle(loaded.mediaTitle);
      });
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
      sendRealtimeEvent("room_state", updated);
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
    sendRealtimeEvent,
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
    appendChat(`Host announcement: ${clean}`, false, true, "System");
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
      const outgoing = settings.profanityFilter ? sanitizeProfanity(chatInput) : chatInput.trim();
      appendChat(outgoing, true, true);
      setChatInput("");
      playUiPop();
    },
    [appendChat, chatInput, isHost, playUiPop, roomState, rulesAccepted, settings.profanityFilter]
  );

  const sendQuickSpark = useCallback(
    (spark: string) => {
      appendChat(spark, true, true);
      playUiPop();
    },
    [appendChat, playUiPop]
  );

  const sendEmoji = useCallback(
    (emoji: string) => {
      appendChat(`${emoji} ${emoji}`, true, true);
      playUiPop();
    },
    [appendChat, playUiPop]
  );

  const sendAiEmoticon = useCallback(() => {
    const pick = aiStyleEmoticons[Math.floor(Math.random() * aiStyleEmoticons.length)];
    appendChat(`${pick} hype check`, true, true);
    playUiPop();
  }, [appendChat, playUiPop]);

  const sendCustomEmoticon = useCallback(
    (emoticon: CustomEmoticon) => {
      appendChat(emoticon.label, true, true, undefined, emoticon.src);
      playUiPop();
    },
    [appendChat, playUiPop]
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
    if (!roomState) return;
    if (!videoRef.current) {
      if (effectiveService.externalOnly) {
        openOfficialMedia();
        flashNotice("Opened official player. Use its built-in sync/PiP controls.");
      }
      return;
    }
    const expected =
      roomState.playhead + (roomState.playing ? (Date.now() - roomState.updatedAt) / 1000 : 0);
    videoRef.current.currentTime = Math.max(0, expected);
  }, [effectiveService.externalOnly, flashNotice, openOfficialMedia, roomState]);

  const toggleCaptions = useCallback(() => {
    setCaptionsOn((current) => {
      const next = !current;
      patchSettings({ subtitlesEnabled: next });
      return next;
    });
  }, [patchSettings]);

  const toggleFullscreen = useCallback(async () => {
    const target = playerShellRef.current || videoRef.current;
    if (!target) return;
    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      flashNotice("Fullscreen is unavailable on this device.");
    }
  }, [flashNotice]);

  const togglePictureInPicture = useCallback(async () => {
    if (effectiveService.externalOnly) {
      openOfficialMedia();
      flashNotice("PiP is handled by the official player/app. Opened it now.");
      return;
    }
    const video = videoRef.current as VideoWithPiP | null;
    if (!video) return;
    const pipDocument = document as DocumentWithPiP;
    try {
      if (pipDocument.pictureInPictureElement && pipDocument.exitPictureInPicture) {
        await pipDocument.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      } else {
        flashNotice("Picture-in-picture is not supported.");
      }
    } catch {
      flashNotice("Unable to toggle picture-in-picture.");
    }
  }, [effectiveService.externalOnly, flashNotice, openOfficialMedia]);

  const openVoiceRoom = useCallback(async () => {
    try {
      await openSecureServiceTab(voiceRoomUrl, selectedService.accent);
      pushLog("Opened high-quality voice room");
      flashNotice("Voice room opened (Jitsi secure tab).");
    } catch {
      flashNotice("Could not open voice room.");
    }
  }, [flashNotice, openSecureServiceTab, pushLog, selectedService.accent, voiceRoomUrl]);

  useEffect(() => {
    if (!selectedServiceId && session?.serviceId) {
      setSelectedServiceId(session.serviceId);
      localStorage.setItem(SERVICE_KEY, session.serviceId);
    }
  }, [selectedServiceId, session?.serviceId]);

  useEffect(() => {
    if (selectedServiceId) {
      setHomeServiceId(selectedServiceId);
      return;
    }
    if (session?.serviceId) {
      setHomeServiceId(session.serviceId);
    }
  }, [selectedServiceId, session?.serviceId]);

  useEffect(() => {
    setAccountNameDraft(session?.username ?? "");
  }, [session?.username]);

  useEffect(() => {
    if (currentPath !== "/room") return;
    if (!roomState?.mediaUrl || !session?.username || !effectiveService.externalOnly) return;
    const onceKey = `${STORAGE_PREFIX}.officialOpened.${roomState.roomCode}.${session.username}.${roomState.mediaUrl}`;
    if (localStorage.getItem(onceKey) === "1") return;
    localStorage.setItem(onceKey, "1");
    void openSecureServiceTab(roomState.mediaUrl, effectiveService.accent)
      .then(() => flashNotice(`${effectiveService.name} opened automatically.`))
      .catch(() => flashNotice(`Could not auto-open ${effectiveService.name}.`));
  }, [
    currentPath,
    effectiveService.accent,
    effectiveService.externalOnly,
    effectiveService.name,
    flashNotice,
    openSecureServiceTab,
    roomState?.mediaUrl,
    roomState?.roomCode,
    session?.username
  ]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let listener: { remove: () => Promise<void> } | null = null;
    void Browser.addListener("browserFinished", () => {
      if (!active) return;
      void handleBrowserReturn();
    }).then((handle) => {
      listener = handle;
    });
    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, [handleBrowserReturn]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!pendingBrowserActionRef.current) return;
      if (Date.now() - browserLaunchAtRef.current < 1000) return;
      void handleBrowserReturn();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [handleBrowserReturn]);

  useEffect(() => {
    writeJson(LOBBY_DRAFT_KEY, {
      roomCode,
      mediaTitle,
      watchUrl,
      rightsConfirmed
    });
  }, [mediaTitle, rightsConfirmed, roomCode, watchUrl]);

  useEffect(() => {
    writeJson(CUSTOM_EMOTICONS_KEY, customEmoticons);
  }, [customEmoticons]);

  useEffect(() => {
    setCaptionsOn(settings.subtitlesEnabled);
  }, [settings.subtitlesEnabled]);

  useEffect(() => {
    if (!roomState?.roomCode) return;
    const savedMessages = readJson<ChatMessage[]>(roomChatKey(roomState.roomCode), []);
    if (savedMessages.length) {
      setChatMessages(savedMessages.slice(-90));
    }
    const savedReactions = readJson<{
      fireReactions: number;
      heartReactions: number;
      wowReactions: number;
    } | null>(roomReactionKey(roomState.roomCode), null);
    if (savedReactions) {
      setFireReactions(Math.max(0, savedReactions.fireReactions || 0));
      setHeartReactions(Math.max(0, savedReactions.heartReactions || 0));
      setWowReactions(Math.max(0, savedReactions.wowReactions || 0));
    }
  }, [roomState?.roomCode]);

  useEffect(() => {
    if (!roomState?.roomCode) return;
    writeJson(roomChatKey(roomState.roomCode), chatMessages);
    writeJson(roomReactionKey(roomState.roomCode), {
      fireReactions,
      heartReactions,
      wowReactions
    });
  }, [chatMessages, fireReactions, heartReactions, roomState?.roomCode, wowReactions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveProgressSnapshot("auto");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [saveProgressSnapshot]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      saveProgressSnapshot("auto");
    }, 15000);
    return () => window.clearInterval(interval);
  }, [saveProgressSnapshot]);

  useEffect(() => {
    const onBeforeUnload = () => {
      saveProgressSnapshot("auto");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveProgressSnapshot]);

  useEffect(() => {
    const onFullScreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  useEffect(() => {
    if (!session) return;
    if (backendHealth === "healthy") pushLog("Backend health check: Supabase realtime connected");
    if (backendHealth === "degraded") pushLog("Backend health check: Supabase degraded, fallback active");
  }, [backendHealth, pushLog, session]);

  useEffect(() => {
    const knownPaths = new Set(["/services", "/auth", "/lobby", "/room", "/settings", "/account"]);
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
      const fallbackCode = (normalizedRoomCode || localStorage.getItem(lastRoomKey(session.username)) || "")
        .trim()
        .toUpperCase();
      if (fallbackCode) {
        const restored = normalizeRoomState(
          readJson<RoomState | null>(roomStorageKey(fallbackCode), null)
        );
        if (restored) {
          setRoomState(restored);
          setWatchUrl(restored.mediaUrl);
          setMediaTitle(restored.mediaTitle);
          setRoomCode(restored.roomCode);
          return;
        }
      }
      navigate("/lobby", { replace: true });
      return;
    }
  }, [currentPath, navigate, normalizedRoomCode, roomState, selectedServiceId, session]);

  useEffect(() => {
    if (!autoJoinRoomCode || !session || currentPath !== "/lobby") return;
    if (normalizedRoomCode !== autoJoinRoomCode) {
      setRoomCode(autoJoinRoomCode);
      return;
    }
    handleJoinRoom();
    setAutoJoinRoomCode(null);
  }, [autoJoinRoomCode, currentPath, handleJoinRoom, normalizedRoomCode, session]);

  useEffect(() => {
    if (currentPath !== "/auth") return;
    if (session || !selectedServiceId || !serviceConnected) return;
    const recent = recentProfiles[0];
    if (!recent) return;
    const who = autoContinueToLobby(recent);
    flashNotice(`Auto-continued with ${who}.`);
  }, [autoContinueToLobby, currentPath, flashNotice, recentProfiles, selectedServiceId, serviceConnected, session]);

  useEffect(() => {
    if (currentPath !== "/auth") return;
    if (!authAutoStartServiceId) return;
    if (authAutoStartServiceId !== selectedService.id) return;
    if (serviceConnected) {
      setAuthAutoStartServiceId(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void startServiceSignIn();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [authAutoStartServiceId, currentPath, selectedService.id, serviceConnected, startServiceSignIn]);

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
    if (!supabaseClient || !session || !normalizedRoomCode) {
      if (!SUPABASE_CONFIGURED) setBackendHealth("fallback");
      return;
    }
    setBackendHealth("checking");
    const channel = supabaseClient.channel(`kinopulse:${normalizedRoomCode}`, {
      config: { broadcast: { self: false } }
    });

    channel.on("broadcast", { event: "room_state" }, ({ payload }) => {
      const incoming = normalizeRoomState(payload as RoomState);
      if (!incoming) return;
      setRoomState((current) => {
        if (!current) return incoming;
        return incoming.updatedAt > current.updatedAt ? incoming : current;
      });
      if (roomKey) writeJson(roomKey, incoming);
    });

    channel.on("broadcast", { event: "chat_message" }, ({ payload }) => {
      const incoming = payload as ChatMessage;
      if (!incoming?.text) return;
      setChatMessages((current) => {
        if (current.some((entry) => entry.id === incoming.id)) return current;
        return [...current, { ...incoming, own: incoming.user === username }].slice(-90);
      });
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setBackendHealth("healthy");
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setBackendHealth("degraded");
    });

    roomChannelRef.current = channel;
    return () => {
      roomChannelRef.current = null;
      void supabaseClient.removeChannel(channel);
    };
  }, [normalizedRoomCode, roomKey, session, username]);

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
    const video = videoRef.current;
    if (!video) return;
    const applyTrackMode = () => {
      const track = video.textTracks?.[0];
      if (!track) return;
      track.mode = captionsOn ? "showing" : "disabled";
    };
    applyTrackMode();
    video.addEventListener("loadedmetadata", applyTrackMode);
    return () => video.removeEventListener("loadedmetadata", applyTrackMode);
  }, [captionsOn, inAppVideoUrl]);

  useEffect(() => {
    if (!settings.keepScreenAwake || !partyLive || !("wakeLock" in navigator)) return;
    let cancelled = false;
    const wakeLockNavigator = navigator as NavigatorWithWakeLock;
    const requestWakeLock = async () => {
      try {
        if (!wakeLockNavigator.wakeLock) return;
        wakeLockRef.current = await wakeLockNavigator.wakeLock.request("screen");
      } catch {
        if (!cancelled) flashNotice("Screen lock control unavailable.");
      }
    };
    void requestWakeLock();
    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        void wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [flashNotice, partyLive, settings.keepScreenAwake]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current !== null) window.clearTimeout(noticeTimeoutRef.current);
      if (achievementTimeoutRef.current !== null) window.clearTimeout(achievementTimeoutRef.current);
    };
  }, []);

  const RoomComposer = (
    <section className="panel room-composer compact-room-composer">
      <div className="panel-head">
        <h2>Quick lobby</h2>
        <span className={`chip ${serviceConnected ? "chip-safe" : ""}`}>
          {serviceConnected ? `${selectedService.name} connected` : `${selectedService.name} sign-in needed`}
        </span>
      </div>

      <div className="compact-lobby-grid">
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
            placeholder={`https://${selectedService.domains[0]}`}
          />
        </label>
      </div>

      <div className="button-row compact-row">
        <button type="button" onClick={generateRoomCode}>
          Generate
        </button>
        <button type="button" onClick={copyRoomCode}>
          Copy code
        </button>
        <button type="button" onClick={pasteWatchUrlFromClipboard}>
          Auto-link
        </button>
      </div>

      {allowedDomainStatus === "allowed" && <p className="ok">Service domain validated.</p>}
      {allowedDomainStatus === "blocked" && selectedService.externalOnly && (
        <p className="warn">Use a matching {selectedService.name} link to launch this room.</p>
      )}
      {allowedDomainStatus === "blocked" && !selectedService.externalOnly && (
        <p className="note">Direct URL mode allows third-party links when you hold content rights.</p>
      )}
      {allowedDomainStatus === "invalid" && <p className="warn">Invalid URL. Use full https:// link.</p>}
      {!serviceConnected && (
        <p className="warn">Complete secure {selectedService.name} sign-in first.</p>
      )}

      <label className="check">
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(event) => setRightsConfirmed(event.target.checked)}
        />
        I confirm I have rights or permission to share this content in the room.
      </label>

      <div className="button-row compact-row">
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

      <details className="auth-manual-profile lobby-advanced">
        <summary>Advanced lobby tools</summary>
        <label>
          Session title
          <input
            value={mediaTitle}
            onChange={(event) => setMediaTitle(event.target.value)}
            placeholder={`${selectedService.name} watch party`}
          />
        </label>
        <div className="button-row compact-row">
          <button type="button" onClick={copyInvite}>
            Copy invite
          </button>
          <button type="button" onClick={() => setSettingsOpen((prev) => !prev)}>
            {settingsOpen ? "Close settings" : "Open settings"}
          </button>
          <button type="button" onClick={switchProfile}>
            Switch profile
          </button>
        </div>
        <div className="auth-browser-card lobby-auth-card">
          <div className="auth-browser-head">
            <h3>Official account handoff</h3>
            <span className={`chip ${serviceConnected ? "chip-safe" : ""}`}>
              {serviceConnected ? "Signed in" : "Sign-in required"}
            </span>
          </div>
          <p className="subtle">
            We keep account login and content browsing in official provider pages for policy-safe playback.
          </p>
          <div className="button-row compact-row">
            <button type="button" className="browser-cta" onClick={startServiceSignIn}>
              One-tap {selectedService.name} sign-in
            </button>
            <button type="button" onClick={openServiceCatalog}>
              Open service catalog
            </button>
            <button type="button" onClick={confirmServiceSignIn}>
              Fallback: I finished sign-in
            </button>
            <button type="button" onClick={openVoiceRoom}>
              Open voice room
            </button>
          </div>
        </div>
      </details>

      {joinPending && <p className="ok">Join request queued. Host approval auto-connects you.</p>}
      {authError && <p className="warn">{authError}</p>}
      {notice && <p className="ok">{notice}</p>}
      {launchDisabled && launchBlockReason && <p className="note">{launchBlockReason}</p>}
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
              <strong>{backendLabel}</strong>
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

          <section className="panel">
            <h3>Voice chat</h3>
            <p className="subtle">
              Quick room voice uses secure Jitsi link. For premium scale consider LiveKit, Daily, or Agora.
            </p>
            <div className="button-row">
              <button type="button" onClick={openVoiceRoom}>
                Open voice room
              </button>
              <button type="button" onClick={() => setVoiceTipsOpen((current) => !current)}>
                {voiceTipsOpen ? "Hide voice tips" : "Show voice tips"}
              </button>
            </div>
            {voiceTipsOpen && (
              <p className="voice-tip">
                Best quality: headphones, mute when not speaking, and stable Wi-Fi. Voice room URL:
                <br />
                <strong>{voiceRoomUrl}</strong>
              </p>
            )}
          </section>

          <section className="panel">
            <h3>Progress safety</h3>
            <p className="subtle">
              Automatic checkpoints keep your lobby, chat, and moderation state safe on refresh or crashes.
            </p>
            <p className="subtle">
              Last auto-checkpoint: <strong>{formatStamp(lastCheckpointAt)}</strong>
            </p>
            <p className="subtle">
              Last manual checkpoint: <strong>{formatStamp(lastManualCheckpointAt)}</strong>
            </p>
            <div className="button-row">
              <button type="button" onClick={() => saveProgressSnapshot("manual")}>
                Save checkpoint now
              </button>
              <button type="button" onClick={restoreLastCheckpoint}>
                Restore checkpoint
              </button>
              <button type="button" onClick={exportBackup}>
                Export backup
              </button>
              <button type="button" onClick={openImportBackupPicker}>
                Import backup
              </button>
            </div>
            <input
              ref={importBackupRef}
              type="file"
              accept=".json,application/json"
              onChange={importBackupFromFile}
              hidden
            />
          </section>

          <section className="panel">
            <h3>Custom emoticons</h3>
            <p className="subtle">
              Movie-themed emoticon pack is preloaded from your concept style. Upload extra image emoticons anytime.
            </p>
            <div className="button-row">
              <button type="button" onClick={openEmoticonUploadPicker}>
                Upload emoticon images
              </button>
              <button type="button" onClick={clearCustomEmoticons} disabled={!hasUploadedEmoticons}>
                Clear uploaded pack
              </button>
            </div>
            <input
              ref={emoticonUploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={importCustomEmoticonFiles}
              hidden
            />
            {customEmoticons.length > 0 ? (
              <div className="emoji-strip custom-strip">
                {customEmoticons.slice(0, 8).map((emoticon) => (
                  <span key={`settings-${emoticon.id}`} className="emoji-chip custom preview-only">
                    <img src={emoticon.src} alt={emoticon.label} />
                  </span>
                ))}
              </div>
            ) : (
              <p className="subtle">Movie emoticon pack ready.</p>
            )}
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
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={(event) => patchSettings({ showTimestamps: event.target.checked })}
                />
                Show message timestamps
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.cinematicButtons}
                  onChange={(event) => patchSettings({ cinematicButtons: event.target.checked })}
                />
                Cinematic 3D buttons
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(event) => patchSettings({ highContrast: event.target.checked })}
                />
                High contrast mode
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.subtitlesEnabled}
                  onChange={(event) => patchSettings({ subtitlesEnabled: event.target.checked })}
                />
                Enable subtitles by default
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.soundsEnabled}
                  onChange={(event) => patchSettings({ soundsEnabled: event.target.checked })}
                />
                UI sound feedback
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.profanityFilter}
                  onChange={(event) => patchSettings({ profanityFilter: event.target.checked })}
                />
                Profanity filter in chat
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.keepScreenAwake}
                  onChange={(event) => patchSettings({ keepScreenAwake: event.target.checked })}
                />
                Keep screen awake in live room
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

  if (!selectedServiceId || currentPath === "/services") {
    const topServices = ["netflix", "prime", "max", "disney", "appletv", "youtube", "paramount", "peacock"];
    const displayServices = serviceCatalog.filter((s) => topServices.includes(s.id));
    return (
      <div className="popcorn-app popcorn-configure">
        <div className="popcorn-particles">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="popcorn-particle" />
          ))}
        </div>
        <header className="popcorn-header popcorn-header-main">
          <div className="popcorn-header-left">
            <div className="popcorn-brand">
              <img src={popcornLogoPath} alt="PopcornLobby" />
              <span>PopcornLobby</span>
            </div>
          </div>
          <button
            type="button"
            className={`popcorn-settings-btn ${settingsOpen ? "active" : ""}`}
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </header>
        <div className="popcorn-configure-content">
          <h1 className="popcorn-configure-title">CONFIGURE YOUR PRIVATE PARTY</h1>
          <p className="popcorn-section-title">1. Choose Your Streaming Service</p>
          <div className="popcorn-service-grid">
            {displayServices.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`popcorn-service-icon ${homeServiceId === service.id ? "selected" : ""}`}
                style={{ background: homeServiceId === service.id ? service.accent : undefined }}
                onClick={() => setHomeServiceId(service.id)}
              >
                {service.tag}
              </button>
            ))}
            <button
              type="button"
              className="popcorn-service-icon more"
              onClick={() => {
                const rest = serviceCatalog.filter((s) => !topServices.includes(s.id));
                const idx = rest.findIndex((s) => s.id === homeServiceId);
                setHomeServiceId(rest[(idx + 1) % Math.max(1, rest.length)]?.id ?? rest[0]?.id ?? homeServiceId);
              }}
            >
              …
            </button>
          </div>
          <p className="popcorn-section-title">2. Enter Video Link or Search</p>
          <div className="popcorn-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={watchUrl}
              onChange={(e) => setWatchUrl(e.target.value)}
              placeholder="Paste a URL or search for content..."
            />
          </div>
          <p className="popcorn-section-title">3. Name Your Party (Optional)</p>
          <input
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
            placeholder="e.g., Friyay Movie Night"
          />
          <button type="button" className="popcorn-start-btn" onClick={startRoomFromHome}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Start Party & Get Invite Link
          </button>

          <div className="popcorn-join-divider">
            <span>Have an invite code?</span>
          </div>
          <div className="popcorn-join-block">
            <p className="popcorn-join-label">Enter room code to join</p>
            <div className="popcorn-join-row">
              <input
                className="popcorn-join-input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. FLIX87"
                maxLength={12}
              />
              <button type="button" className="popcorn-join-paste" onClick={pasteRoomCodeFromClipboard}>
                Paste
              </button>
            </div>
            <button type="button" className="popcorn-join-btn" onClick={() => runQuickJoinFromHome()}>
              Join Party
            </button>
            {recentRoomCards.length > 0 && (
              <div className="popcorn-join-recent">
                <p className="popcorn-join-recent-label">Recent:</p>
                {recentRoomCards.slice(0, 2).map((room) => (
                  <button
                    key={`${room.roomCode}-${room.serviceId}`}
                    type="button"
                    className="popcorn-join-recent-btn"
                    onClick={() => rejoinRecentRoom(room)}
                  >
                    {room.roomCode} · {room.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {notice && (
          <div className="popcorn-toast" role="status">
            {notice}
          </div>
        )}
        {SettingsSheet}
      </div>
    );
  }

  if (!session || currentPath === "/auth") {
    return (
      <div className="popcorn-app popcorn-auth-page">
        <div className="popcorn-particles">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="popcorn-particle" />
          ))}
        </div>
        <header className="popcorn-header popcorn-header-main">
          <div className="popcorn-header-left">
            <button type="button" className="popcorn-hamburger" onClick={() => navigate("/services")} aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="popcorn-brand">
              <img src={popcornLogoPath} alt="PopcornLobby" />
              <span>PopcornLobby</span>
            </div>
          </div>
        </header>
        <div className="popcorn-auth-content">
          <div className="popcorn-auth-step">Step 1 of 2</div>
          <h1 className="popcorn-auth-title">Sign in to {selectedService.name}</h1>
          <p className="popcorn-auth-subtitle">
            We open the official {selectedService.name} page in a secure tab. Your credentials never pass through our servers.
          </p>

          <button
            type="button"
            className={`popcorn-auth-cta ${serviceConnected ? "connected" : ""}`}
            onClick={serviceConnected ? continueInstantly : startServiceSignIn}
          >
            {serviceConnected ? (
              <>
                <span className="popcorn-auth-check">✓</span>
                Continue as {recommendedAuthProfile}
              </>
            ) : (
              <>Sign in with {selectedService.name}</>
            )}
          </button>

          {authInfo && <p className="popcorn-auth-info">{authInfo}</p>}
          {authError && <p className="popcorn-auth-error">{authError}</p>}

          <button type="button" className="popcorn-auth-fallback" onClick={confirmServiceSignIn}>
            I already signed in — continue
          </button>

          <div className="popcorn-auth-divider">—</div>

          <div className="popcorn-auth-step">Step 2 of 2</div>
          <h2 className="popcorn-auth-label">Your display name</h2>
          <input
            className="popcorn-auth-input"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
            placeholder="e.g., Alex, MovieFan123"
          />
          <p className="popcorn-auth-hint">Leave blank for a random guest name</p>

          <form onSubmit={handleAuthSubmit} className="popcorn-auth-form">
            <button type="submit" className="popcorn-start-btn" disabled={!serviceConnected}>
              Continue to lobby
            </button>
          </form>

          {recentProfiles.length > 0 && (
            <div className="popcorn-auth-recent">
              <p className="popcorn-auth-recent-label">Quick switch:</p>
              <div className="popcorn-auth-recent-pills">
                {recentProfiles.map((profile) => (
                  <button key={profile} type="button" className="popcorn-auth-pill" onClick={() => loginRecentProfile(profile)}>
                    {profile}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" className="popcorn-auth-link" onClick={resetServiceSelection}>
            Choose different service
          </button>
        </div>
        {notice && (
          <div className="popcorn-toast" role="status">
            {notice}
          </div>
        )}
      </div>
    );
  }

  if (currentPath === "/account") {
    return (
      <main
        className={`app app-pre-room viewport-lock ${themeClass} ${settings.reduceMotion ? "reduce-motion" : ""} ${
          settings.cinematicButtons ? "cinematic-buttons" : ""
        } ${settings.highContrast ? "high-contrast" : ""}`}
      >
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />
        <section className="card compact-page-shell utility-page-card">
          <header className="hero">
            <p className="route-pill">Account</p>
            <div className="hero-topline">
              <img src={brandLogoPath} alt="KinoPulse logo" className="brand-logo" />
              <span className="hero-badge">{selectedService.name} profile</span>
            </div>
            <div className="status-row">
              <span className="chip chip-safe">Signed in</span>
              <span className="chip">User: {session.username}</span>
              <span className="chip">{backendLabel}</span>
            </div>
          </header>

          <section className="panel">
            <h2>Display profile</h2>
            <label>
              Display name
              <input
                value={accountNameDraft}
                onChange={(event) => setAccountNameDraft(event.target.value)}
                placeholder="Guest775"
              />
            </label>
            <div className="button-row compact-row">
              <button type="button" onClick={saveAccountName}>
                Save profile
              </button>
              <button type="button" onClick={openSettingsPage}>
                Open settings
              </button>
              <button type="button" onClick={returnToPrimaryPage}>
                Back to room
              </button>
              <button type="button" onClick={switchProfile}>
                Switch account
              </button>
            </div>
            {notice && <p className="ok">{notice}</p>}
          </section>

          {recentProfiles.length > 0 && (
            <section className="panel">
              <h3>Recent profiles</h3>
              <div className="quick-profiles">
                {recentProfiles.map((profile) => (
                  <button
                    key={`account-${profile}`}
                    type="button"
                    className="profile-pill"
                    onClick={() => {
                      persistSession({ username: profile, serviceId: selectedService.id });
                      rememberProfile(profile);
                      flashNotice(`Switched to ${profile}.`);
                    }}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="panel">
            <h3>Helpful pro tips</h3>
            <ul>
              <li>Use short room codes for fewer join mistakes on mobile.</li>
              <li>Host should paste the exact watch URL before launching for faster sync.</li>
              <li>Headphones + push-to-talk reduce echo in group voice rooms.</li>
            </ul>
          </section>
        </section>
      </main>
    );
  }

  if (currentPath === "/settings") {
    return (
      <main
        className={`app app-pre-room viewport-lock ${themeClass} ${settings.reduceMotion ? "reduce-motion" : ""} ${
          settings.cinematicButtons ? "cinematic-buttons" : ""
        } ${settings.highContrast ? "high-contrast" : ""}`}
      >
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />
        <section className="card compact-page-shell utility-page-card">
          <header className="hero">
            <p className="route-pill">Settings</p>
            <div className="hero-topline">
              <img src={brandLogoPath} alt="KinoPulse logo" className="brand-logo" />
              <span className="hero-badge">Room controls & accessibility</span>
            </div>
            <div className="button-row compact-row">
              <button type="button" onClick={openAccountPage}>
                Account
              </button>
              <button type="button" onClick={returnToPrimaryPage}>
                Back to room
              </button>
            </div>
          </header>

          <section className="panel utility-settings-grid">
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
              Reduce motion
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={settings.subtitlesEnabled}
                onChange={(event) => patchSettings({ subtitlesEnabled: event.target.checked })}
              />
              Subtitles on by default
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={settings.keepScreenAwake}
                onChange={(event) => patchSettings({ keepScreenAwake: event.target.checked })}
              />
              Keep screen awake
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={settings.profanityFilter}
                onChange={(event) => patchSettings({ profanityFilter: event.target.checked })}
              />
              Profanity filter
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={settings.soundsEnabled}
                onChange={(event) => patchSettings({ soundsEnabled: event.target.checked })}
              />
              UI sound feedback
            </label>
          </section>

          <section className="panel">
            <h3>Progress & backup</h3>
            <p className="subtle">
              Auto checkpoint: <strong>{formatStamp(lastCheckpointAt)}</strong>
            </p>
            <div className="button-row compact-row">
              <button type="button" onClick={() => saveProgressSnapshot("manual")}>
                Save checkpoint
              </button>
              <button type="button" onClick={restoreLastCheckpoint}>
                Restore
              </button>
              <button type="button" onClick={exportBackup}>
                Export
              </button>
              <button type="button" onClick={openImportBackupPicker}>
                Import
              </button>
            </div>
            <input
              ref={importBackupRef}
              type="file"
              accept=".json,application/json"
              onChange={importBackupFromFile}
              hidden
            />
          </section>

          <section className="panel">
            <h3>Movie emoticon pack</h3>
            <p className="subtle">Built-in movie pack + your uploaded custom image emoticons.</p>
            <div className="button-row compact-row">
              <button type="button" onClick={openEmoticonUploadPicker}>
                Upload images
              </button>
              <button type="button" onClick={clearCustomEmoticons} disabled={!hasUploadedEmoticons}>
                Clear uploaded pack
              </button>
            </div>
            <input
              ref={emoticonUploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={importCustomEmoticonFiles}
              hidden
            />
            <div className="emoji-strip custom-strip">
              {customEmoticons.slice(0, 10).map((emoticon) => (
                <span key={`settings-page-${emoticon.id}`} className="emoji-chip custom preview-only">
                  <img src={emoticon.src} alt={emoticon.label} />
                </span>
              ))}
            </div>
          </section>

          <section className="panel legal">
            <h3>Legal links</h3>
            <p>
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
        </section>
      </main>
    );
  }



  if (currentPath === "/lobby" || !partyLive) {
    return (
      <div className="popcorn-app popcorn-configure">
        <div className="popcorn-particles">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="popcorn-particle" />
          ))}
        </div>
        <header className="popcorn-header popcorn-header-main">
          <div className="popcorn-header-left">
            <button
              type="button"
              className={`popcorn-settings-btn ${settingsOpen ? "active" : ""}`}
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-label="Settings"
              aria-expanded={settingsOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="popcorn-brand">
              <img src={popcornLogoPath} alt="PopcornLobby" />
              <span>PopcornLobby</span>
            </div>
          </div>
          <div className="popcorn-avatar" title={username || "Profile"}>
            {(username || "U").charAt(0).toUpperCase()}
          </div>
        </header>
        <div className="popcorn-configure-content" style={{ paddingBottom: 24 }}>
          <h1 className="popcorn-configure-title">LOBBY SETUP</h1>
          <section className="sticky-video lobby-preview" style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", background: "#000" }}>
            {youtubeEmbedPreview ? (
              <iframe
                className="video-stage lobby-video-stage"
                src={youtubeEmbedPreview}
                title="YouTube preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
              />
            ) : (
              <video className="video-stage lobby-video-stage" src={lobbyPreviewUrl} controls playsInline muted style={{ width: "100%", aspectRatio: "16/9", display: "block" }} />
            )}
          </section>
          {RoomComposer}
        </div>
        {SettingsSheet}
        {achievement && (
          <aside className="achievement-pop" role="status" aria-live="polite">
            <p className="achievement-title">{achievement.title}</p>
            <p className="achievement-body">{achievement.body}</p>
          </aside>
        )}
      </div>
    );
  }

  return (
    <div className="popcorn-app popcorn-lobby-page">
      <header className="popcorn-header popcorn-header-main">
        <div className="popcorn-header-left">
            <button
              type="button"
              className={`popcorn-settings-btn ${settingsOpen ? "active" : ""}`}
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-label="Settings"
              aria-expanded={settingsOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          <div className="popcorn-brand">
            <img src={popcornLogoPath} alt="PopcornLobby" />
            <span>PopcornLobby</span>
          </div>
        </div>
        <div className="popcorn-avatar" title={username || "Profile"}>
          {(username || "U").charAt(0).toUpperCase()}
        </div>
      </header>

      <p className="popcorn-lobby-title">YOUR PRIVATE PARTY LOBBY</p>
      <div className="popcorn-participants-row">
        <div className="popcorn-host-block">
          <div className="popcorn-host-avatar">
            {(roomState.leader || username || "H").charAt(0).toUpperCase()}
          </div>
          <p className="popcorn-host-label">HOST</p>
        </div>
        <div className="popcorn-invite-block">
          <div className="popcorn-invite-slots">
            {[1, 2, 3].map((i) => (
              <div key={i} className="popcorn-invite-slot">+</div>
            ))}
          </div>
          <p className="popcorn-inviting-label">Inviting...</p>
        </div>
      </div>

      <div className="popcorn-video-wrap" ref={playerShellRef}>
        {useNativeVideoPlayer ? (
          <video
            ref={videoRef}
            src={inAppVideoUrl}
            preload="metadata"
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
          >
            <track
              kind="subtitles"
              src="/subtitles/bigbuckbunny_en.vtt"
              srcLang="en"
              label="English"
              default={settings.subtitlesEnabled}
            />
          </video>
        ) : roomYouTubeEmbedUrl ? (
          <iframe
            src={roomYouTubeEmbedUrl}
            title="YouTube live room player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
            <p>Playback in official {effectiveService.name} app</p>
            <button type="button" onClick={openOfficialMedia} className="popcorn-start-btn" style={{ marginTop: 12 }}>
              Open {effectiveService.name}
            </button>
          </div>
        )}
        <div className="popcorn-video-controls">
          <button type="button" onClick={() => seekBy(-10)} disabled={!isHost} aria-label="Rewind">
            ⏪
          </button>
          <button type="button" onClick={togglePlayback} disabled={!isHost} aria-label={roomState.playing ? "Pause" : "Play"}>
            {roomState.playing ? "⏸" : "▶"}
          </button>
          <button type="button" onClick={() => seekBy(10)} disabled={!isHost} aria-label="Forward">
            ⏩
          </button>
          <div className="popcorn-progress-bar">
            <div
              className="popcorn-progress-fill"
              style={{
                width: `${Math.min(100, ((videoRef.current?.currentTime ?? roomState.playhead) / (videoRef.current?.duration || 1)) * 100)}%`
              }}
            />
          </div>
          <span className="popcorn-time">
            {formatTime(videoRef.current?.currentTime ?? roomState.playhead)} / {formatTime(videoRef.current?.duration || 0)}
          </span>
        </div>
      </div>

      <section className="popcorn-chat-section">
        <h2 className="popcorn-chat-title">Party Chat</h2>
        <div className="popcorn-chat-messages">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="popcorn-chat-bubble">
              <div className="popcorn-chat-avatar">{msg.user.charAt(0).toUpperCase()}</div>
              <div className="popcorn-chat-content">
                <p className="popcorn-chat-meta">
                  <strong>{msg.user === roomState.leader ? `(Host: ${msg.user}) ` : `${msg.user}: `}</strong>
                  <span className="popcorn-chat-text">{msg.text}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <form className="inline-form" onSubmit={handleSendChat} style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Drop a message..."
            disabled={(!rulesAccepted && !isHost) || (!!roomState.chatLocked && !isHost)}
          />
          <button type="submit" disabled={(!rulesAccepted && !isHost) || (!!roomState.chatLocked && !isHost)}>
            Send
          </button>
        </form>
      </section>

      <button
        type="button"
        className="popcorn-manage-btn"
        onClick={() => {
          copyInvite();
          setSettingsOpen((prev) => !prev);
        }}
      >
        Manage Lobby & Invite
      </button>

      {SettingsSheet}
      {achievement && (
        <aside className="achievement-pop" role="status" aria-live="polite">
          <p className="achievement-title">{achievement.title}</p>
          <p className="achievement-body">{achievement.body}</p>
        </aside>
      )}
    </div>
  );
}

export default App;
