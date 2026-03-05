import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import TopBar from "../components/TopBar";

export default function HomePage() {
  const nav = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const normalizedCode = useMemo(() => roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), [roomCode]);

  return (
    <div className="min-h-full">
      <TopBar />
      <Container>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight">Netflix-style watch rooms (without Netflix passwords)</h1>
            <p className="mt-3 text-white/70">
              Netflix doesn’t offer a public OAuth/API for third-party watch-party apps. The practical approach is: users
              log into Netflix normally in their own browser, and a small extension connects that tab to a room for
              syncing.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              className="rounded-xl bg-primary px-5 py-4 text-left font-medium hover:bg-primary-dark"
              onClick={() => nav("/create")}
            >
              Create a room
              <div className="mt-1 text-sm font-normal text-white/80">Generate a code + host key for Netflix sync</div>
            </button>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white/80">Join a room</div>
              <div className="mt-2 flex gap-2">
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="ROOMCODE"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/20"
                />
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15 disabled:opacity-50"
                  disabled={normalizedCode.length < 4}
                  onClick={() => nav(`/room/${normalizedCode}`)}
                >
                  Join
                </button>
              </div>
              <div className="mt-2 text-xs text-white/50">You can paste codes like “ab12-3c” — it’ll normalize.</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

