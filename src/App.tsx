import { FormEvent, useMemo, useState } from "react";

type VerifyResponse = {
  ok: true;
  verificationToken: string;
  expiresAt: string;
  note: string;
};

type RoomResponse = {
  ok: true;
  room: {
    code: string;
    roomName: string;
    hostName: string;
    service: "netflix";
    createdAt: string;
  };
};

const tokenPreview = (value: string) =>
  value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function App() {
  const [netflixId, setNetflixId] = useState("");
  const [secureNetflixId, setSecureNetflixId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [roomName, setRoomName] = useState("Friday Night Movie");
  const [hostName, setHostName] = useState("Host");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const verificationExpiryLabel = useMemo(() => {
    if (!verificationExpiresAt) {
      return "";
    }
    const date = new Date(verificationExpiresAt);
    return date.toLocaleString();
  }, [verificationExpiresAt]);

  const onVerifyNetflixSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setCreatedRoomCode("");
    setIsVerifying(true);

    try {
      const response = await fetch("/api/netflix/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netflixId: netflixId.trim(),
          secureNetflixId: secureNetflixId.trim(),
        }),
      });
      const data = (await response.json()) as VerifyResponse & {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Netflix verification failed.");
      }

      setVerificationToken(data.verificationToken);
      setVerificationExpiresAt(data.expiresAt);
      setStatusMessage(data.note);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Netflix verification failed.";
      setVerificationToken("");
      setVerificationExpiresAt("");
      setErrorMessage(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const onCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setCreatedRoomCode("");
    setIsCreatingRoom(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken,
          roomName: roomName.trim(),
          hostName: hostName.trim(),
        }),
      });
      const data = (await response.json()) as RoomResponse & {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Room creation failed.");
      }

      setCreatedRoomCode(data.room.code);
      setStatusMessage(
        `Room "${data.room.roomName}" created for Netflix. Share code ${data.room.code}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Room creation failed.";
      setErrorMessage(message);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <main className="page">
      <section className="card hero">
        <p className="eyebrow">HEARO-style Netflix Gate</p>
        <h1>Create a Netflix room only after Netflix authentication</h1>
        <p className="muted">
          This example validates Netflix session cookies server-side and blocks room
          creation until verification succeeds.
        </p>
      </section>

      <section className="card">
        <h2>Step 1 — Verify Netflix session</h2>
        <p className="muted">
          Paste your Netflix cookies from a signed-in browser session:
          <code>NetflixId</code> and <code>SecureNetflixId</code>.
        </p>
        <form onSubmit={onVerifyNetflixSession} className="form-grid">
          <label>
            NetflixId
            <input
              value={netflixId}
              onChange={(event) => setNetflixId(event.target.value)}
              placeholder="Paste NetflixId cookie value"
              autoComplete="off"
              required
            />
          </label>
          <label>
            SecureNetflixId
            <input
              value={secureNetflixId}
              onChange={(event) => setSecureNetflixId(event.target.value)}
              placeholder="Paste SecureNetflixId cookie value"
              autoComplete="off"
              required
            />
          </label>
          <button type="submit" disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify Netflix Authentication"}
          </button>
        </form>

        {verificationToken && (
          <div className="notice success">
            <p>
              Verified token: <strong>{tokenPreview(verificationToken)}</strong>
            </p>
            <p>Expires at: {verificationExpiryLabel}</p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Step 2 — Create Netflix room</h2>
        <p className="muted">
          Room creation requires a valid verification token from Step 1.
        </p>
        <form onSubmit={onCreateRoom} className="form-grid">
          <label>
            Room name
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Friday Night Movie"
              required
            />
          </label>
          <label>
            Host name
            <input
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder="Host"
              required
            />
          </label>
          <button type="submit" disabled={!verificationToken || isCreatingRoom}>
            {isCreatingRoom ? "Creating..." : "Create Netflix Room"}
          </button>
        </form>

        {createdRoomCode && (
          <div className="notice success">
            <p>
              Room created: <strong>{createdRoomCode}</strong>
            </p>
            <p>Service lock: Netflix only</p>
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
