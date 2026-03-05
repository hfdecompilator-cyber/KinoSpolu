import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { AppMode, AppUser } from "../types";

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

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<AppMode>("live");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setMode("demo");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ? mapUser(data.session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setMode("live");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const canUseLiveMode = useMemo(() => isSupabaseConfigured && Boolean(supabase), []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return;
    setBusy(true);
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setAuthMessage(error ? error.message : null);
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    if (!supabase) return;
    setBusy(true);
    setAuthMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() || "Member" },
        emailRedirectTo: window.location.origin,
      },
    });
    setBusy(false);
    setAuthMessage(
      error
        ? error.message
        : "Account created. Check your inbox for the confirmation email if required.",
    );
  };

  const sendMagicLink = async (email: string) => {
    if (!supabase) return;
    setBusy(true);
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
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
    setMode("demo");
    setUser({
      id: crypto.randomUUID(),
      name: name.trim() || "Guest",
      isGuest: true,
    });
    setAuthMessage(null);
  };

  const signOut = async () => {
    if (mode === "demo") {
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
    authMessage,
    canUseLiveMode,
    signInWithPassword,
    signUpWithPassword,
    sendMagicLink,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };
}
