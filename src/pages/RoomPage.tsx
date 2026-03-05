import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "../components/Container";
import TopBar from "../components/TopBar";
import { RoomWsClient } from "../lib/wsClient";
import type { ServerToClient } from "../lib/wsProtocol";

function getClientId() {
  const key = "streamhub_client_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8787";

type RoomState = Extract<ServerToClient, { type: "room_state" }>;

export default function RoomPage() {
  const { roomCode: roomCodeParam } = useParams();
  const roomCode = (roomCodeParam ?? "").trim().toUpperCase();
  const clientId = useMemo(getClientId, []);

  const [displayName, setDisplayName] = useState("Viewer");
  const [hostKey, setHostKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const wsRef = useRef<RoomWsClient | null>(null);

  useEffect(() => {
    const ws = new RoomWsClient(DEFAULT_WS_URL, {
      onOpen: () => {
        setConnected(true);
        setError(null);
        ws.joinRoom({
          roomCode,
          displayName: displayName.trim() || "Viewer",
          clientId,
          role: "web",
          hostKey: hostKey.trim() || undefined,
        });
      },
      onClose: () => setConnected(false),
      onError: (msg) => setError(msg),
      onRoomState: (evt) => setRoomState(evt),
    });
    wsRef.current = ws;
    ws.connect();
    return () => ws.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const myParticipant = roomState?.participants.find((p) => p.clientId === clientId);
  const canControl = myParticipant?.canControl ?? false;

  return (
    <div className="min-h-full">
      <TopBar />
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Room {roomCode}</h2>
            <div className="mt-1 text-sm text-white/60">
              Sync server: <span className="font-mono">{DEFAULT_WS_URL}</span>
            </div>
            <div className="mt-1 text-xs text-white/50">
              Status: {connected ? <span className="text-emerald-300">connected</span> : <span>disconnected</span>}
              {error ? <span className="ml-2 text-red-300">({error})</span> : null}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
              onClick={() => navigator.clipboard.writeText(roomCode)}
            >
              Copy code
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-white/80">Playback state</div>
              <div className="text-xs text-white/50">
                Last action:{" "}
                <span className="font-mono">{roomState?.playback.lastActionBy ? roomState.playback.lastActionBy : "-"}</span>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60">Playing</div>
                  <div className="text-lg font-semibold">{roomState?.playback.isPlaying ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60">Time (seconds)</div>
                  <div className="font-mono text-lg">{roomState ? roomState.playback.timeSeconds.toFixed(2) : "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60">Control</div>
                  <div className="text-sm font-semibold">{canControl ? "Enabled" : "View-only"}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                  disabled={!canControl || !roomState}
                  onClick={() => wsRef.current?.playback({ roomCode, clientId, action: "play" })}
                >
                  Play
                </button>
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
                  disabled={!canControl || !roomState}
                  onClick={() => wsRef.current?.playback({ roomCode, clientId, action: "pause" })}
                >
                  Pause
                </button>
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
                  disabled={!canControl || !roomState}
                  onClick={() => wsRef.current?.playback({ roomCode, clientId, action: "seek", timeSeconds: 0 })}
                >
                  Seek 0:00
                </button>
              </div>

              <div className="mt-4 text-xs text-white/50">
                If you linked a Netflix tab with the extension, the extension will apply these actions to the Netflix
                player (and also send actions when you use Netflix controls).
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white/80">You</div>

            <label className="mt-3 block text-xs text-white/50">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            />

            <label className="mt-3 block text-xs text-white/50">Host key (optional)</label>
            <input
              value={hostKey}
              onChange={(e) => setHostKey(e.target.value)}
              placeholder="Paste to control playback"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs outline-none placeholder:text-white/30 focus:border-white/20"
            />

            <button
              className="mt-3 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15"
              onClick={() =>
                wsRef.current?.joinRoom({
                  roomCode,
                  displayName: displayName.trim() || "Viewer",
                  clientId,
                  role: "web",
                  hostKey: hostKey.trim() || undefined,
                })
              }
            >
              Re-join with these settings
            </button>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="text-sm font-medium text-white/80">Participants</div>
              <div className="mt-2 space-y-2">
                {roomState?.participants?.length ? (
                  roomState.participants.map((p) => (
                    <div key={p.clientId} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{p.displayName}</div>
                        <div className="text-xs text-white/50">
                          {p.role} {p.clientId === roomState.hostClientId ? "• host" : ""}
                        </div>
                      </div>
                      <div className="text-xs text-white/60">{p.canControl ? "control" : "viewer"}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/60">Waiting for state…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

