import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  markets?: string[];
  signupUrl?: string;
};

type ContentItem = {
  id: string;
  title: string;
  kind: "movie" | "show" | "youtube";
  serviceId: string;
  description: string;
  url: string;
  thumbnail: string;
  embedUrl?: string;
};

type RoomParticipant = {
  id: string;
  name: string;
  role: "host" | "guest";
  joinedAt: string;
  accessVerified: boolean;
};

type RoomPlayback = {
  status: "playing" | "paused";
  positionSec: number;
  updatedAt: string;
  updatedBy: string;
};

type RoomMessage = {
  id: string;
  participantId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type Room = {
  id: string;
  code: string;
  roomName: string;
  hostName: string;
  serviceId: string;
  serviceName: string;
  createdAt: string;
  partyLink: string;
  legalNotice: string;
  selectedContent?: {
    title: string;
    kind: string;
    url: string;
    thumbnail: string | null;
    pickedAt: string;
    pickedBy: string;
  };
  roomTier?: "free" | "premium";
  participantLimit?: number;
  participants: RoomParticipant[];
  playback: RoomPlayback;
  messages: RoomMessage[];
};

const SERVICE_ICONS: Record<string, string> = {
  netflix: "N",
  disney_plus: "D+",
  hulu: "H",
  prime_video: "PV",
  hbo_max: "MAX",
  plex: "P",
  paramount_plus: "P+",
  youtube: "YT",
  crunchyroll: "CR",
  google_drive: "GD",
  pluto_tv: "PT",
  tubi: "TB",
  youtube_tv: "YTV",
  twitch: "TW",
  voyo: "VO",
  ivysilani: "iV",
  rtvs: "RT",
  prima_plus: "P+",
  o2_tv: "O2",
  skylink_live_tv: "SL",
};

const SERVICE_HOME: Record<string, string> = {
  netflix: "https://www.netflix.com/browse",
  disney_plus: "https://www.disneyplus.com/home",
  hulu: "https://www.hulu.com/hub/home",
  prime_video: "https://www.primevideo.com/storefront/home",
  hbo_max: "https://play.max.com/",
  plex: "https://watch.plex.tv/",
  paramount_plus: "https://www.paramountplus.com/home/",
  youtube: "https://www.youtube.com/",
  crunchyroll: "https://www.crunchyroll.com/",
  google_drive: "https://drive.google.com/",
  pluto_tv: "https://pluto.tv/",
  tubi: "https://tubitv.com/",
  youtube_tv: "https://tv.youtube.com/",
  twitch: "https://www.twitch.tv/",
  voyo: "https://voyo.nova.cz/",
  ivysilani: "https://www.ceskatelevize.cz/ivysilani/",
  rtvs: "https://www.rtvs.sk/televizia/archiv",
  prima_plus: "https://www.iprima.cz/",
  o2_tv: "https://www.o2tv.cz/",
  skylink_live_tv: "https://livetv.skylink.cz/",
};

const CONTENT_LIBRARY: Record<string, ContentItem[]> = {
  netflix: [
    {
      id: "n1",
      title: "Sci‑Fi Night Pick",
      kind: "movie",
      serviceId: "netflix",
      description: "Future city thriller for a synchronized watch party.",
      url: "https://www.netflix.com/browse",
      thumbnail:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop",
    },
    {
      id: "n2",
      title: "Mystery Series Episode",
      kind: "show",
      serviceId: "netflix",
      description: "Perfect for episodic co-watch with chat reactions.",
      url: "https://www.netflix.com/browse",
      thumbnail:
        "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop",
    },
  ],
  youtube: [
    {
      id: "y1",
      title: "Lofi coding stream",
      kind: "youtube",
      serviceId: "youtube",
      description: "Lightweight test content for party sync.",
      url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
      thumbnail: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    },
    {
      id: "y2",
      title: "NASA live stream",
      kind: "youtube",
      serviceId: "youtube",
      description: "Live feed for watch-party lobby testing.",
      url: "https://www.youtube.com/watch?v=21X5lGlDOfg",
      embedUrl: "https://www.youtube.com/embed/21X5lGlDOfg",
      thumbnail: "https://img.youtube.com/vi/21X5lGlDOfg/hqdefault.jpg",
    },
  ],
  hulu: [
    {
      id: "h1",
      title: "Comedy Night Queue",
      kind: "show",
      serviceId: "hulu",
      description: "Short episodes with perfect chat pacing.",
      url: "https://www.hulu.com/hub/home",
      thumbnail:
        "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&auto=format&fit=crop",
    },
    {
      id: "h2",
      title: "Weekend Thriller",
      kind: "movie",
      serviceId: "hulu",
      description: "Long-form film for group movie night.",
      url: "https://www.hulu.com/hub/home",
      thumbnail:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop",
    },
  ],
};

const tokenPreview = (value: string) =>
  value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const makeGenericContent = (service: Service | null): ContentItem[] => {
  const id = service?.id ?? "service";
  const name = service?.name ?? "Service";
  const baseUrl = SERVICE_HOME[id] ?? "https://www.google.com";

  return [
    {
      id: `${id}-g1`,
      title: `${name} Featured Movie`,
      kind: "movie",
      serviceId: id,
      description: "Trending title ready to open in provider tab.",
      url: baseUrl,
      thumbnail:
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop",
    },
    {
      id: `${id}-g2`,
      title: `${name} Series Premiere`,
      kind: "show",
      serviceId: id,
      description: "Episode pick for a synchronized lobby launch.",
      url: baseUrl,
      thumbnail:
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop",
    },
  ];
};

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [mode, setMode] = useState<"start" | "join">("start");

  const [selectedServiceId, setSelectedServiceId] = useState("netflix");
  const [hostName, setHostName] = useState("Host");
  const [roomName, setRoomName] = useState("Friday Night Movie");
  const [roomTier, setRoomTier] = useState<"free" | "premium">("free");
  const [startAccessToken, setStartAccessToken] = useState("");
  const [startExpiresAt, setStartExpiresAt] = useState("");
  const [startNetflixId, setStartNetflixId] = useState("");
  const [startSecureNetflixId, setStartSecureNetflixId] = useState("");
  const [startAccountRef, setStartAccountRef] = useState("");
  const [startAttestationAccepted, setStartAttestationAccepted] = useState(false);
  const [isVerifyingStartAccess, setIsVerifyingStartAccess] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [browserSection, setBrowserSection] = useState<"catalog" | "preview">("catalog");
  const [browserAddress, setBrowserAddress] = useState(SERVICE_HOME.netflix);

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("Guest");
  const [joinRoomPreview, setJoinRoomPreview] = useState<Room | null>(null);
  const [joinAccessToken, setJoinAccessToken] = useState("");
  const [joinExpiresAt, setJoinExpiresAt] = useState("");
  const [joinNetflixId, setJoinNetflixId] = useState("");
  const [joinSecureNetflixId, setJoinSecureNetflixId] = useState("");
  const [joinAccountRef, setJoinAccountRef] = useState("");
  const [joinAttestationAccepted, setJoinAttestationAccepted] = useState(false);
  const [isLoadingJoinRoom, setIsLoadingJoinRoom] = useState(false);
  const [isVerifyingJoinAccess, setIsVerifyingJoinAccess] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceConsentAccepted, setVoiceConsentAccepted] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStartAccessToken("");
    setStartExpiresAt("");
    setSelectedContent(null);
    setBrowserSection("catalog");
    setBrowserAddress(SERVICE_HOME[selectedServiceId] ?? "https://www.google.com");
  }, [selectedServiceId]);

  useEffect(() => {
    setJoinAccessToken("");
    setJoinExpiresAt("");
  }, [joinRoomPreview?.serviceId]);

  const serviceForStart = useMemo(
    () => services.find((entry) => entry.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const joinService = useMemo(
    () =>
      services.find((entry) => entry.id === joinRoomPreview?.serviceId) ??
      (joinRoomPreview
        ? { id: joinRoomPreview.serviceId, name: joinRoomPreview.serviceName }
        : null),
    [services, joinRoomPreview],
  );

  const browserCatalog = useMemo(
    () => CONTENT_LIBRARY[selectedServiceId] ?? makeGenericContent(serviceForStart),
    [selectedServiceId, serviceForStart],
  );

  const currentUser = useMemo(
    () => activeRoom?.participants.find((entry) => entry.id === participantId) ?? null,
    [activeRoom, participantId],
  );
  const isHost = currentUser?.role === "host";

  const refreshRoom = async (code: string) => {
    const response = await fetch(`/api/rooms/${code}`);
    const data = await response.json();
    if (!response.ok || !data.ok || !data.room) {
      throw new Error(data.error ?? "Could not fetch room state.");
    }
    setActiveRoom(data.room as Room);
  };

  useEffect(() => {
    if (!activeRoom?.code) {
      return;
    }
    const interval = window.setInterval(() => {
      refreshRoom(activeRoom.code).catch(() => {});
    }, 2500);
    return () => window.clearInterval(interval);
  }, [activeRoom?.code]);

  const verifyAccess = async (params: {
    serviceId: string;
    displayName: string;
    section: "start" | "join";
  }) => {
    const { serviceId, displayName, section } = params;
    const netflixId = section === "start" ? startNetflixId : joinNetflixId;
    const secureNetflixId =
      section === "start" ? startSecureNetflixId : joinSecureNetflixId;
    const accountReference = section === "start" ? startAccountRef : joinAccountRef;
    const attestationAccepted =
      section === "start" ? startAttestationAccepted : joinAttestationAccepted;

    const response = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        displayName,
        netflixId,
        secureNetflixId,
        accountReference,
        attestationAccepted,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.accessToken) {
      throw new Error(data.error ?? "Access verification failed.");
    }
    return data as { accessToken: string; expiresAt: string; note?: string };
  };

  const onPickContent = (item: ContentItem) => {
    setSelectedContent(item);
    setBrowserAddress(item.url);
    setBrowserSection("preview");
    setStatusMessage(`Selected "${item.title}". Now create lobby.`);
  };

  const onVerifyStartAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsVerifyingStartAccess(true);
    try {
      const data = await verifyAccess({
        serviceId: selectedServiceId,
        displayName: hostName.trim(),
        section: "start",
      });
      setStartAccessToken(data.accessToken);
      setStartExpiresAt(data.expiresAt);
      setStatusMessage(data.note ?? "Access verified.");
    } catch (error) {
      setStartAccessToken("");
      setStartExpiresAt("");
      setErrorMessage(error instanceof Error ? error.message : "Access verification failed.");
    } finally {
      setIsVerifyingStartAccess(false);
    }
  };

  const onCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedContent) {
      setErrorMessage("Pick a movie/show/video in the in-app browser first.");
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    setIsCreatingRoom(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: startAccessToken,
          serviceId: selectedServiceId,
          roomTier,
          roomName: roomName.trim(),
          hostName: hostName.trim(),
          contentTitle: selectedContent.title,
          contentKind: selectedContent.kind,
          contentUrl: selectedContent.url,
          contentThumbnail: selectedContent.thumbnail,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room || !data.participantId) {
        throw new Error(data.error ?? "Could not create lobby.");
      }
      setActiveRoom(data.room as Room);
      setParticipantId(String(data.participantId));
      setJoinCode(String(data.room.code));
      setMode("join");
      setStatusMessage(`Lobby created: ${data.room.code}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create lobby.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const onLoadJoinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setJoinAccessToken("");
    setJoinExpiresAt("");
    setIsLoadingJoinRoom(true);
    try {
      const response = await fetch(`/api/rooms/${joinCode.trim().toUpperCase()}`);
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room) {
        throw new Error(data.error ?? "Room not found.");
      }
      setJoinRoomPreview(data.room as Room);
      setStatusMessage(
        `Loaded room ${data.room.code}. Verify ${data.room.serviceName} access to join.`,
      );
    } catch (error) {
      setJoinRoomPreview(null);
      setErrorMessage(error instanceof Error ? error.message : "Room not found.");
    } finally {
      setIsLoadingJoinRoom(false);
    }
  };

  const onVerifyJoinAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinRoomPreview) {
      setErrorMessage("Load a room first.");
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    setIsVerifyingJoinAccess(true);
    try {
      const data = await verifyAccess({
        serviceId: joinRoomPreview.serviceId,
        displayName: joinName.trim(),
        section: "join",
      });
      setJoinAccessToken(data.accessToken);
      setJoinExpiresAt(data.expiresAt);
      setStatusMessage(data.note ?? "Join access verified.");
    } catch (error) {
      setJoinAccessToken("");
      setJoinExpiresAt("");
      setErrorMessage(error instanceof Error ? error.message : "Access verification failed.");
    } finally {
      setIsVerifyingJoinAccess(false);
    }
  };

  const onJoinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinRoomPreview) {
      setErrorMessage("Load a room first.");
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    setIsJoiningRoom(true);
    try {
      const response = await fetch(`/api/rooms/${joinRoomPreview.code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: joinName.trim(),
          accessToken: joinAccessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room || !data.participantId) {
        throw new Error(data.error ?? "Could not join room.");
      }
      setActiveRoom(data.room as Room);
      setParticipantId(String(data.participantId));
      setStatusMessage(`Joined lobby ${data.room.code}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not join room.");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const updatePlayback = async (action: "play" | "pause" | "seek", nextSec?: number) => {
    if (!activeRoom?.code) {
      return;
    }
    try {
      const response = await fetch(`/api/rooms/${activeRoom.code}/playback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          action,
          positionSec: nextSec ?? activeRoom.playback.positionSec,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room) {
        throw new Error(data.error ?? "Playback update failed.");
      }
      setActiveRoom(data.room as Room);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Playback update failed.");
    }
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRoom?.code) {
      return;
    }
    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/rooms/${activeRoom.code}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, text: chatDraft.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room) {
        throw new Error(data.error ?? "Message failed.");
      }
      setActiveRoom(data.room as Room);
      setChatDraft("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Message failed.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const onLeaveRoom = async () => {
    if (!activeRoom?.code) {
      return;
    }
    await fetch(`/api/rooms/${activeRoom.code}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    });
    setActiveRoom(null);
    setParticipantId("");
    setIsVoiceEnabled(false);
    setVoiceConsentAccepted(false);
    setStatusMessage("Left lobby.");
  };

  const onCopyInvite = async () => {
    if (!activeRoom?.code) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/room/${activeRoom.code}`);
    setStatusMessage("Invite copied.");
  };

  const startServiceIsNetflix = selectedServiceId === "netflix";
  const joinServiceIsNetflix = joinRoomPreview?.serviceId === "netflix";

  return (
    <main className="page">
      <section className="card hero">
        <div className="segmented">
          <button
            className={mode === "start" ? "segment active" : "segment"}
            onClick={() => setMode("start")}
            type="button"
          >
            Start Party
          </button>
          <button
            className={mode === "join" ? "segment active" : "segment"}
            onClick={() => setMode("join")}
            type="button"
          >
            Join
          </button>
        </div>
        <div className="premium-banner">
          <strong>Unlock Hearo Premium ✨</strong>
          <span>Video chat, ad-free watch, and richer rooms.</span>
        </div>
        <h1>Start Watching</h1>
        <p className="muted">
          Pick content in the in-app browser, then launch into a synchronized lobby.
        </p>
        <div className="service-grid">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className={
                selectedServiceId === service.id ? "service-tile active" : "service-tile"
              }
              onClick={() => setSelectedServiceId(service.id)}
            >
              <span className="service-icon">{SERVICE_ICONS[service.id] ?? "SV"}</span>
              <span className="service-name">{service.name}</span>
              {service.markets?.includes("cz") || service.markets?.includes("sk") ? (
                <span className="market-tag">CZ/SK</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {mode === "start" && (
        <>
          <section className="grid-two">
            <article className="card">
              <h2>Verify host access</h2>
              <p className="muted">
                Service: <strong>{serviceForStart?.name ?? selectedServiceId}</strong>
              </p>
              <form className="form-grid" onSubmit={onVerifyStartAccess}>
                <label>
                  Host name
                  <input
                    value={hostName}
                    onChange={(event) => setHostName(event.target.value)}
                    required
                  />
                </label>
                {startServiceIsNetflix ? (
                  <>
                    <label>
                      NetflixId cookie
                      <input
                        value={startNetflixId}
                        onChange={(event) => setStartNetflixId(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      SecureNetflixId cookie
                      <input
                        value={startSecureNetflixId}
                        onChange={(event) => setStartSecureNetflixId(event.target.value)}
                        required
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Account reference
                      <input
                        value={startAccountRef}
                        onChange={(event) => setStartAccountRef(event.target.value)}
                        required
                      />
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={startAttestationAccepted}
                        onChange={(event) => setStartAttestationAccepted(event.target.checked)}
                        required
                      />
                      I confirm I can legally watch this content on my own account.
                    </label>
                  </>
                )}
                <button type="submit" disabled={isVerifyingStartAccess}>
                  {isVerifyingStartAccess ? "Verifying..." : "Verify access"}
                </button>
              </form>
              {startAccessToken && (
                <div className="notice success">
                  <p>
                    Token: <strong>{tokenPreview(startAccessToken)}</strong>
                  </p>
                  <p>Expires: {new Date(startExpiresAt).toLocaleString()}</p>
                </div>
              )}
            </article>

            <article className="card">
              <h2>Create lobby</h2>
              <p className="muted">
                Room can start only after access + content selection.
              </p>
              <form className="form-grid" onSubmit={onCreateRoom}>
                <label>
                  Plan
                  <select
                    value={roomTier}
                    onChange={(event) =>
                      setRoomTier(event.target.value === "premium" ? "premium" : "free")
                    }
                  >
                    <option value="free">Free (up to 3 people)</option>
                    <option value="premium">Premium (up to 10 people)</option>
                  </select>
                </label>
                <label>
                  Lobby name
                  <input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={!startAccessToken || !selectedContent || isCreatingRoom}
                >
                  {isCreatingRoom ? "Launching..." : "Launch Lobby"}
                </button>
              </form>
              <div className="notice info">
                Ads are shown in social/lobby UI only, never over provider video playback.
              </div>
              {selectedContent && (
                <div className="notice info">
                  <p>
                    Picked: <strong>{selectedContent.title}</strong>
                  </p>
                  <p>Type: {selectedContent.kind}</p>
                </div>
              )}
            </article>
          </section>

          <section className="card browser-shell">
            <div className="browser-top">
              <div className="browser-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="browser-address">{browserAddress}</div>
            </div>
            <div className="browser-tabs">
              <button
                type="button"
                className={browserSection === "catalog" ? "browser-tab active" : "browser-tab"}
                onClick={() => setBrowserSection("catalog")}
              >
                Browse titles
              </button>
              <button
                type="button"
                className={browserSection === "preview" ? "browser-tab active" : "browser-tab"}
                onClick={() => setBrowserSection("preview")}
              >
                Lobby preview
              </button>
            </div>

            {browserSection === "catalog" && (
              <div className="browser-catalog">
                {browserCatalog.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedContent?.id === item.id ? "pick-card active" : "pick-card"}
                    onClick={() => onPickContent(item)}
                  >
                    <img src={item.thumbnail} alt={item.title} />
                    <div>
                      <p>{item.title}</p>
                      <span>{item.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {browserSection === "preview" && (
              <div className="browser-preview">
                {!selectedContent ? (
                  <p className="muted">Pick a title in Browse titles to enter lobby preview.</p>
                ) : (
                  <>
                    <div className="preview-meta">
                      <h3>{selectedContent.title}</h3>
                      <p>{selectedContent.description}</p>
                      <a href={selectedContent.url} target="_blank" rel="noreferrer">
                        Open in provider tab
                      </a>
                    </div>
                    {selectedContent.embedUrl ? (
                      <iframe
                        src={selectedContent.embedUrl}
                        title={selectedContent.title}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="provider-placeholder">
                        <img src={selectedContent.thumbnail} alt={selectedContent.title} />
                        <p>
                          Content selected. On launch, participants are taken into lobby with this
                          title.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {mode === "join" && (
        <section className="grid-two">
          <article className="card">
            <h2>Load room by code</h2>
            <form className="form-grid" onSubmit={onLoadJoinRoom}>
              <label>
                Room code
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="AB12CD"
                  required
                />
              </label>
              <button type="submit" disabled={isLoadingJoinRoom}>
                {isLoadingJoinRoom ? "Loading..." : "Load room"}
              </button>
            </form>
            {joinRoomPreview && (
              <div className="notice info">
                <p>
                  Room: <strong>{joinRoomPreview.roomName}</strong>
                </p>
                <p>
                  Required service: <strong>{joinRoomPreview.serviceName}</strong>
                </p>
                {joinRoomPreview.selectedContent?.title && (
                  <p>
                    Selected title: <strong>{joinRoomPreview.selectedContent.title}</strong>
                  </p>
                )}
                {joinService?.signupUrl && (
                  <p>
                    Need access?{" "}
                    <a href={joinService.signupUrl} target="_blank" rel="noreferrer">
                      Sign up for {joinService.name}
                    </a>
                  </p>
                )}
                <p>{joinRoomPreview.legalNotice}</p>
              </div>
            )}
          </article>

          <article className="card">
            <h2>Verify access and join</h2>
            <form className="form-grid" onSubmit={onVerifyJoinAccess}>
              <label>
                Your name
                <input
                  value={joinName}
                  onChange={(event) => setJoinName(event.target.value)}
                  required
                />
              </label>
              {joinServiceIsNetflix ? (
                <>
                  <label>
                    NetflixId cookie
                    <input
                      value={joinNetflixId}
                      onChange={(event) => setJoinNetflixId(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    SecureNetflixId cookie
                    <input
                      value={joinSecureNetflixId}
                      onChange={(event) => setJoinSecureNetflixId(event.target.value)}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Account reference
                    <input
                      value={joinAccountRef}
                      onChange={(event) => setJoinAccountRef(event.target.value)}
                      required
                    />
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={joinAttestationAccepted}
                      onChange={(event) => setJoinAttestationAccepted(event.target.checked)}
                      required
                    />
                    I confirm I can legally watch this title from my own account.
                  </label>
                </>
              )}
              <button type="submit" disabled={!joinRoomPreview || isVerifyingJoinAccess}>
                {isVerifyingJoinAccess ? "Verifying..." : "Verify join access"}
              </button>
            </form>
            {joinAccessToken && (
              <div className="notice success">
                <p>
                  Join token: <strong>{tokenPreview(joinAccessToken)}</strong>
                </p>
                <p>Expires: {new Date(joinExpiresAt).toLocaleString()}</p>
              </div>
            )}
            <form className="form-grid" onSubmit={onJoinRoom}>
              <button
                type="submit"
                disabled={!joinRoomPreview || !joinAccessToken || isJoiningRoom}
              >
                {isJoiningRoom ? "Joining..." : "Join lobby"}
              </button>
            </form>
          </article>
        </section>
      )}

      <section className="card">
        <h2>Live lobby</h2>
        {!activeRoom ? (
          <p className="muted">Create or join a room to enter lobby.</p>
        ) : (
          <div className="room-stack">
            <div className="room-row">
              <p>
                <strong>{activeRoom.roomName}</strong> ({activeRoom.code}) |{" "}
                {activeRoom.serviceName}
              </p>
              <button type="button" className="ghost" onClick={onCopyInvite}>
                Copy invite
              </button>
            </div>

            {activeRoom.selectedContent?.title && (
              <div className="lobby-title">
                <p>
                  Lobby title: <strong>{activeRoom.selectedContent.title}</strong>
                </p>
                {activeRoom.selectedContent.thumbnail && (
                  <img
                    src={activeRoom.selectedContent.thumbnail}
                    alt={activeRoom.selectedContent.title}
                  />
                )}
              </div>
            )}

            <p className="notice info">{activeRoom.legalNotice}</p>
            <p className="muted">
              Participants: {activeRoom.participants.length} | You:{" "}
              {currentUser?.name ?? "Unknown"} ({currentUser?.role ?? "n/a"})
            </p>
            <p className="muted">
              Plan: {activeRoom.roomTier ?? "free"} | Participant limit:{" "}
              {activeRoom.participantLimit ?? 3}
            </p>

            <div className="playback-panel">
              <p>
                Playback: <strong>{activeRoom.playback.status}</strong> at{" "}
                <strong>{formatClock(activeRoom.playback.positionSec)}</strong>
              </p>
              <div className="button-row">
                <button type="button" onClick={() => updatePlayback("play")} disabled={!isHost}>
                  Play
                </button>
                <button type="button" onClick={() => updatePlayback("pause")} disabled={!isHost}>
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updatePlayback("seek", Math.max(activeRoom.playback.positionSec - 10, 0))
                  }
                  disabled={!isHost}
                >
                  -10s
                </button>
                <button
                  type="button"
                  onClick={() => updatePlayback("seek", activeRoom.playback.positionSec + 10)}
                  disabled={!isHost}
                >
                  +10s
                </button>
              </div>
            </div>

            <div className="voice-panel">
              <p>
                Voice: <strong>{isVoiceEnabled ? "Connected" : "Disconnected"}</strong>
              </p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={voiceConsentAccepted}
                  onChange={(event) => setVoiceConsentAccepted(event.target.checked)}
                />
                I consent to voice-chat processing under GDPR rules.
              </label>
              <button
                type="button"
                className="ghost"
                disabled={!voiceConsentAccepted}
                onClick={() => setIsVoiceEnabled((v) => !v)}
              >
                {isVoiceEnabled ? "Disconnect voice" : "Connect voice"}
              </button>
            </div>

            <div className="ad-slot">
              Sponsored: Brand-safe placements live in social UI only.
            </div>

            <div className="chat-panel">
              <h3>Chat</h3>
              <div className="chat-log">
                {activeRoom.messages.map((entry) => (
                  <p key={entry.id}>
                    <strong>{entry.senderName}:</strong> {entry.text}
                  </p>
                ))}
              </div>
              <form className="chat-form" onSubmit={onSendMessage}>
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Type a message..."
                  required
                />
                <button type="submit" disabled={isSendingMessage}>
                  {isSendingMessage ? "Sending..." : "Send"}
                </button>
              </form>
            </div>

            <button type="button" className="ghost danger" onClick={onLeaveRoom}>
              Leave lobby
            </button>
          </div>
        )}
      </section>

      {(errorMessage || statusMessage) && (
        <section className="card">
          {errorMessage && <p className="notice error">{errorMessage}</p>}
          {statusMessage && <p className="notice info">{statusMessage}</p>}
        </section>
      )}
    </main>
  );
}
