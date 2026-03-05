import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
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
};

const tokenPreview = (value: string) =>
  value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [mode, setMode] = useState<"start" | "join">("start");

  const [selectedServiceId, setSelectedServiceId] = useState("netflix");
  const [hostName, setHostName] = useState("Host");
  const [roomName, setRoomName] = useState("Friday Night Movie");
  const [startAccessToken, setStartAccessToken] = useState("");
  const [startExpiresAt, setStartExpiresAt] = useState("");
  const [startNetflixId, setStartNetflixId] = useState("");
  const [startSecureNetflixId, setStartSecureNetflixId] = useState("");
  const [startAccountRef, setStartAccountRef] = useState("");
  const [startAttestationAccepted, setStartAttestationAccepted] = useState(false);
  const [isVerifyingStartAccess, setIsVerifyingStartAccess] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

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
      .catch(() => {
        // Keep UI usable even if service list request fails once.
      });
  }, []);

  useEffect(() => {
    setStartAccessToken("");
    setStartExpiresAt("");
  }, [selectedServiceId]);

  useEffect(() => {
    setJoinAccessToken("");
    setJoinExpiresAt("");
  }, [joinRoomPreview?.serviceId]);

  const serviceForStart = useMemo(
    () => services.find((entry) => entry.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );
  const serviceForJoin = useMemo(
    () =>
      services.find((entry) => entry.id === joinRoomPreview?.serviceId) ??
      (joinRoomPreview
        ? { id: joinRoomPreview.serviceId, name: joinRoomPreview.serviceName }
        : null),
    [services, joinRoomPreview],
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
      refreshRoom(activeRoom.code).catch(() => {
        // ignore one polling tick
      });
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
    return data as {
      accessToken: string;
      expiresAt: string;
      legalNotice?: string;
      note?: string;
    };
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
      const message = error instanceof Error ? error.message : "Access verification failed.";
      setErrorMessage(message);
    } finally {
      setIsVerifyingStartAccess(false);
    }
  };

  const onCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          roomName: roomName.trim(),
          hostName: hostName.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.room || !data.participantId) {
        throw new Error(data.error ?? "Could not create room.");
      }
      setActiveRoom(data.room as Room);
      setParticipantId(String(data.participantId));
      setJoinCode(String(data.room.code));
      setMode("join");
      setStatusMessage(`Room created: ${data.room.code}. Invite your friends.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create room.";
      setErrorMessage(message);
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
      const message = error instanceof Error ? error.message : "Room not found.";
      setJoinRoomPreview(null);
      setErrorMessage(message);
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
      setStatusMessage(data.note ?? "Access verified.");
    } catch (error) {
      setJoinAccessToken("");
      setJoinExpiresAt("");
      const message = error instanceof Error ? error.message : "Access verification failed.";
      setErrorMessage(message);
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
      setStatusMessage(`Joined room ${data.room.code}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not join room.";
      setErrorMessage(message);
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
      const message = error instanceof Error ? error.message : "Playback update failed.";
      setErrorMessage(message);
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
      const message = error instanceof Error ? error.message : "Message failed.";
      setErrorMessage(message);
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
    setStatusMessage("Left room.");
  };

  const onCopyInvite = async () => {
    if (!activeRoom?.code) {
      return;
    }
    const invite = `${window.location.origin}/room/${activeRoom.code}`;
    await navigator.clipboard.writeText(invite);
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
          <strong>Unlock Premium</strong>
          <span>Video chat, ad-free mode, and advanced rooms.</span>
        </div>

        <h1>Start Watching</h1>
        <p className="muted">
          Every participant must verify service access before they can join a room.
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
            </button>
          ))}
        </div>
      </section>

      {mode === "start" && (
        <section className="grid-two">
          <article className="card">
            <h2>Verify access for host</h2>
            <p className="muted">
              Selected service: <strong>{serviceForStart?.name ?? selectedServiceId}</strong>
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
                      placeholder="NetflixId"
                      required
                    />
                  </label>
                  <label>
                    SecureNetflixId cookie
                    <input
                      value={startSecureNetflixId}
                      onChange={(event) => setStartSecureNetflixId(event.target.value)}
                      placeholder="SecureNetflixId"
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
                      placeholder="email or user handle"
                      required
                    />
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={startAttestationAccepted}
                      onChange={(event) =>
                        setStartAttestationAccepted(event.target.checked)
                      }
                      required
                    />
                    I confirm I hold rights to watch this content on my own account.
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
                  Access token: <strong>{tokenPreview(startAccessToken)}</strong>
                </p>
                <p>Expires: {new Date(startExpiresAt).toLocaleString()}</p>
              </div>
            )}
          </article>

          <article className="card">
            <h2>Create room</h2>
            <p className="muted">Creation is blocked until host access is verified.</p>
            <form className="form-grid" onSubmit={onCreateRoom}>
              <label>
                Room name
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={!startAccessToken || isCreatingRoom}>
                {isCreatingRoom ? "Creating..." : "Create room"}
              </button>
            </form>
          </article>
        </section>
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

              <button
                type="submit"
                disabled={!joinRoomPreview || isVerifyingJoinAccess}
              >
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
                {isJoiningRoom ? "Joining..." : "Join room"}
              </button>
            </form>
          </article>
        </section>
      )}

      <section className="card">
        <h2>Live room</h2>
        {!activeRoom ? (
          <p className="muted">Create or join a room to open synchronized playback and chat.</p>
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

            <p className="notice info">{activeRoom.legalNotice}</p>
            <p className="muted">
              Participants: {activeRoom.participants.length} | You:{" "}
              {currentUser?.name ?? "Unknown"} ({currentUser?.role ?? "n/a"})
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
              <button type="button" className="ghost" onClick={() => setIsVoiceEnabled((v) => !v)}>
                {isVoiceEnabled ? "Disconnect voice" : "Connect voice"}
              </button>
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
              Leave room
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
