import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import TopBar from "../components/TopBar";
import { RoomWsClient } from "../lib/wsClient";

function getClientId() {
  const key = "streamhub_client_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8787";

export default function CreateRoomPage() {
  const clientId = useMemo(getClientId, []);
  const [displayName, setDisplayName] = useState("Host");
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connected">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [hostKey, setHostKey] = useState<string | null>(null);

  const wsRef = useRef<RoomWsClient | null>(null);

  useEffect(() => {
    const ws = new RoomWsClient(DEFAULT_WS_URL, {
      onOpen: () => {
        setWsStatus("connected");
        setError(null);
      },
      onClose: () => setWsStatus("disconnected"),
      onError: (msg) => setError(msg),
      onRoomCreated: (evt) => {
        setRoomCode(evt.roomCode);
        setHostKey(evt.hostKey);
      },
    });
    wsRef.current = ws;
    ws.connect();
    return () => ws.disconnect();
  }, []);

  return (
    <div className="min-h-full">
      <TopBar />
      <Container>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold tracking-tight">Create a Netflix room</h2>
          <p className="mt-2 text-sm text-white/70">
            Netflix authentication happens on `netflix.com` in the user’s browser. This app never asks for Netflix
            credentials. To sync playback, you’ll link a Netflix tab to this room using the included browser extension.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white/80">Host name</div>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/20"
              />

              <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
                <div className="text-white/60">Sync server</div>
                <div className="font-mono text-white/80">{DEFAULT_WS_URL}</div>
              </div>

              <div className="mt-2 text-xs text-white/50">
                Status: <span className="text-white/70">{wsStatus}</span>
                {error ? <span className="ml-2 text-red-300">({error})</span> : null}
              </div>

              <button
                className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                disabled={wsStatus !== "connected" || displayName.trim().length < 2}
                onClick={() => {
                  setError(null);
                  wsRef.current?.createRoom(displayName.trim(), clientId);
                }}
              >
                Create room
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white/80">Room details</div>

              {roomCode ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="text-xs text-white/60">Room code</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="font-mono text-lg font-semibold">{roomCode}</div>
                      <button
                        className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                        onClick={() => navigator.clipboard.writeText(roomCode)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="text-xs text-white/60">Host key (gives control)</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="font-mono text-sm">{hostKey}</div>
                      <button
                        className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                        onClick={() => (hostKey ? navigator.clipboard.writeText(hostKey) : undefined)}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      Keep this private. You’ll paste it into the extension on the host’s Netflix tab.
                    </div>
                  </div>

                  <Link
                    to={`/room/${roomCode}`}
                    className="block rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-semibold hover:bg-white/15"
                  >
                    Open room dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/60">Create a room to generate a room code + host key.</div>
              )}

              <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
                <div className="font-medium text-white/80">Next</div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/70">
                  <li>Open `netflix.com` in another tab and sign in normally.</li>
                  <li>Load the extension from the `extension/` folder (Chrome: “Load unpacked”).</li>
                  <li>In the extension popup, enter the room code + host key to link your Netflix tab.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

