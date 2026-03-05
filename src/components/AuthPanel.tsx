import { FormEvent, useState } from "react";

type AuthTab = "signin" | "signup" | "magic";

interface AuthPanelProps {
  canUseLiveMode: boolean;
  authBusy: boolean;
  authMessage: string | null;
  onSignInWithPassword: (email: string, password: string) => Promise<void>;
  onSignUpWithPassword: (email: string, password: string, fullName: string) => Promise<void>;
  onSendMagicLink: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: (name: string) => void;
}

export function AuthPanel({
  canUseLiveMode,
  authBusy,
  authMessage,
  onSignInWithPassword,
  onSignUpWithPassword,
  onSendMagicLink,
  onGoogleSignIn,
  onContinueAsGuest,
}: AuthPanelProps) {
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [guestName, setGuestName] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (tab === "signin") {
      await onSignInWithPassword(email, password);
      return;
    }
    if (tab === "signup") {
      await onSignUpWithPassword(email, password, fullName);
      return;
    }
    await onSendMagicLink(email);
  };

  return (
    <section className="card auth-card">
      <h1>Watch together, actually together.</h1>
      <p className="muted">
        HEARO-style watch parties with synced playback, fast chat, and one-click voice room.
      </p>

      <div className="pill-row">
        <button className={tab === "signin" ? "pill active" : "pill"} onClick={() => setTab("signin")}>
          Sign in
        </button>
        <button className={tab === "signup" ? "pill active" : "pill"} onClick={() => setTab("signup")}>
          Create account
        </button>
        <button className={tab === "magic" ? "pill active" : "pill"} onClick={() => setTab("magic")}>
          Magic link
        </button>
      </div>

      {canUseLiveMode ? (
        <>
          <form onSubmit={handleSubmit} className="stack">
            {tab === "signup" && (
              <label>
                Display name
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {tab !== "magic" && (
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                />
              </label>
            )}

            <button className="primary" type="submit" disabled={authBusy}>
              {authBusy ? "Working..." : tab === "signin" ? "Sign in" : tab === "signup" ? "Create account" : "Send magic link"}
            </button>
          </form>

          <button className="ghost" onClick={() => void onGoogleSignIn()} disabled={authBusy}>
            Continue with Google
          </button>
        </>
      ) : (
        <div className="callout warning">
          Supabase keys are missing. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to use live auth.
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onContinueAsGuest(guestName);
        }}
        className="stack"
      >
        <label>
          Quick guest mode
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Nickname"
          />
        </label>
        <button className="secondary" type="submit">
          Continue as guest
        </button>
      </form>

      {authMessage ? <div className="callout">{authMessage}</div> : null}
    </section>
  );
}
