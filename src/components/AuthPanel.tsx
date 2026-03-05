import { FormEvent, useState } from "react";

interface AuthPanelProps {
  canUseLiveMode: boolean;
  authBusy: boolean;
  authMessage: string | null;
  initialEmail: string;
  onQuickAuth: (email: string, password: string, fullName: string) => Promise<void>;
  onSendMagicLink: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: (name: string) => void;
}

export function AuthPanel({
  canUseLiveMode,
  authBusy,
  authMessage,
  initialEmail,
  onQuickAuth,
  onSendMagicLink,
  onGoogleSignIn,
  onContinueAsGuest,
}: AuthPanelProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [guestName, setGuestName] = useState("");

  const handleQuickAuth = async (event: FormEvent) => {
    event.preventDefault();
    await onQuickAuth(email, password, fullName);
  };

  return (
    <section className="card auth-card">
      <h1>Watch together, actually together.</h1>
      <p className="muted">
        One form for login/register, plus magic link and guest mode.
      </p>

      {canUseLiveMode ? (
        <>
          <form onSubmit={handleQuickAuth} className="stack">
            <label>
              Name (optional)
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

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

            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="current-password"
              />
            </label>

            <button className="primary" type="submit" disabled={authBusy}>
              {authBusy ? "Working..." : "Continue (sign in / create account)"}
            </button>
          </form>

          <div className="row wrap">
            <button className="ghost" onClick={() => void onGoogleSignIn()} disabled={authBusy}>
              Continue with Google
            </button>
            <button
              className="ghost"
              onClick={() => void onSendMagicLink(email)}
              disabled={authBusy}
              type="button"
            >
              Email me a magic link
            </button>
          </div>
          <p className="small">Tip: use the same email + password next time and you stay signed in.</p>
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
          Quick guest mode (also saved locally)
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
