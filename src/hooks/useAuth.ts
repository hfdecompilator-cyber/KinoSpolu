import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { AppMode, AppUser } from "../types";

const DEMO_SESSION_KEY = "watchparty_demo_session";
const LAST_EMAIL_KEY = "watchparty_last_email";

interface PersistedDemoSession {
  id: string;
  name: string;
  email?: string;
}

function mapUser(user: User): AppUser {
  const nameFromMetadata =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username;

  return {
    id: user.id,
    email: user.email,
    name: nameFromMetadata || user.email?.split("@")[0] || "Member",
    isGuest: false,
  };
}

function loadDemoSession(): AppUser | null {
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedDemoSession;
    if (!parsed?.id || !parsed?.name) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      isGuest: true,
    };
  } catch {
    return null;
  }
}

function saveDemoSession(user: AppUser): void {
  localStorage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    } satisfies PersistedDemoSession),
  );
}

function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<AppMode>("live");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState<string>(() => localStorage.getItem(LAST_EMAIL_KEY) ?? "");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = loadDemoSession();
      if (demoUser) setUser(demoUser);
      setLoading(false);
      setMode("demo");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        setUser(mapUser(data.session.user));
        setMode("live");
      } else {
        const demoUser = loadDemoSession();
        if (demoUser) {
          setUser(demoUser);
          setMode("demo");
        } else {
          setUser(null);
          setMode("live");
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        clearDemoSession();
        setUser(mapUser(session.user));
        setMode("live");
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const canUseLiveMode = useMemo(() => isSupabaseConfigured && Boolean(supabase), []);

  const quickAuth = async (email: string, password: string, fullName: string) => {
    if (!supabase) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setAuthMessage("Email and password are required.");
      return;
    }

    setBusy(true);
    setAuthMessage(null);
    setLastEmail(normalizedEmail);
    localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (!signInError) {
      clearDemoSession();
      setBusy(false);
      setAuthMessage(null);
      return;
    }

    const canAutoRegister = /Invalid login credentials/i.test(signInError.message);
    if (!canAutoRegister) {
      setBusy(false);
      setAuthMessage(signInError.message);
      return;
    }

    const defaultName = fullName.trim() || normalizedEmail.split("@")[0] || "Member";
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: defaultName },
        emailRedirectTo: window.location.origin,
      },
    });

    setBusy(false);
    if (signUpError) {
      if (/User already registered/i.test(signUpError.message)) {
        setAuthMessage("Account exists, but password is incorrect. Try magic link below.");
        return;
      }
      setAuthMessage(signUpError.message);
      return;
    }

    setAuthMessage("New account created. If email confirmation is enabled, check your inbox.");
  };

  const sendMagicLink = async (email: string) => {
    if (!supabase) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setAuthMessage("Email is required.");
      return;
    }
    setBusy(true);
    setAuthMessage(null);
    setLastEmail(normalizedEmail);
    localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setAuthMessage(error ? error.message : "Magic link sent. Check your email.");
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setAuthMessage(error.message);
  };

  const continueAsGuest = (name: string) => {
    const guestUser: AppUser = {
      id: crypto.randomUUID(),
      name: name.trim() || "Guest",
      isGuest: true,
    };
    setMode("demo");
    setUser(guestUser);
    saveDemoSession(guestUser);
    setAuthMessage(null);
  };

  const signOut = async () => {
    if (mode === "demo") {
      clearDemoSession();
      setUser(null);
      setAuthMessage(null);
      return;
    }
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    setUser(null);
  };

  return {
    user,
    mode,
    loading,
    busy,
    lastEmail,
    authMessage,
    canUseLiveMode,
    quickAuth,
    sendMagicLink,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };
}
