import { useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { LobbyPanel } from "./components/LobbyPanel";
import { WatchRoom } from "./components/WatchRoom";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { generatePartyCode, loadDemoParties, nowIso, safeVideoUrl, saveDemoParties } from "./lib/utils";
import type { Party } from "./types";

export default function App() {
  const {
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
  } = useAuth();

  const [activeParty, setActiveParty] = useState<Party | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const createLiveParty = async (title: string, videoUrl: string) => {
    if (!user || !supabase) return;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generatePartyCode();
      const { data, error } = await supabase
        .from("parties")
        .insert({
          code,
          title: title.trim(),
          video_url: safeVideoUrl(videoUrl),
          host_user_id: user.id,
          host_name: user.name,
        })
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") continue;
        setStatusMessage(error.message);
        return;
      }

      const party: Party = {
        code: data.code,
        title: data.title,
        videoUrl: data.video_url,
        hostUserId: data.host_user_id,
        hostName: data.host_name,
        createdAt: data.created_at,
      };
      setActiveParty(party);
      setStatusMessage(null);
      return;
    }

    setStatusMessage("Could not generate a unique party code. Try again.");
  };

  const createDemoParty = (title: string, videoUrl: string) => {
    if (!user) return;
    const party: Party = {
      code: generatePartyCode(),
      title: title.trim(),
      videoUrl: safeVideoUrl(videoUrl),
      hostUserId: user.id,
      hostName: user.name,
      createdAt: nowIso(),
    };
    const existing = loadDemoParties();
    saveDemoParties([party, ...existing].slice(0, 50));
    setActiveParty(party);
    setStatusMessage("Demo party created.");
  };

  const joinLiveParty = async (code: string) => {
    if (!supabase) return;
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (!data) {
      setStatusMessage("Party not found. Check code and try again.");
      return;
    }

    const party: Party = {
      code: data.code,
      title: data.title,
      videoUrl: data.video_url,
      hostUserId: data.host_user_id,
      hostName: data.host_name,
      createdAt: data.created_at,
    };
    setActiveParty(party);
    setStatusMessage(null);
  };

  const joinDemoParty = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const existing = loadDemoParties();
    const found = existing.find((party) => party.code === cleanCode);
    if (!found) {
      setStatusMessage("Demo party not found. Create one first or confirm the code.");
      return;
    }
    setActiveParty(found);
    setStatusMessage(null);
  };

  const handleCreateParty = async (title: string, videoUrl: string) => {
    if (!title.trim()) {
      setStatusMessage("Party title is required.");
      return;
    }
    if (!user) return;
    if (mode === "live") {
      await createLiveParty(title, videoUrl);
      return;
    }
    createDemoParty(title, videoUrl);
  };

  const handleJoinParty = async (code: string) => {
    if (!code.trim()) {
      setStatusMessage("Party code is required.");
      return;
    }
    if (mode === "live") {
      await joinLiveParty(code);
      return;
    }
    joinDemoParty(code);
  };

  const handleLeaveParty = () => {
    setActiveParty(null);
  };

  if (loading) {
    return (
      <main className="shell">
        <section className="card">
          <p>Loading authentication...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="hero">
        <p className="eyebrow">WatchParty + Supabase</p>
        <h1>Reliable auth, live chat, synced watch rooms, voice chat.</h1>
        <p className="muted">
          Built to feel like HEARO: quick room creation, friend codes, and real-time interaction.
        </p>
      </div>

      {!user ? (
        <AuthPanel
          canUseLiveMode={canUseLiveMode}
          authBusy={busy}
          authMessage={authMessage}
          onSignInWithPassword={signInWithPassword}
          onSignUpWithPassword={signUpWithPassword}
          onSendMagicLink={sendMagicLink}
          onGoogleSignIn={signInWithGoogle}
          onContinueAsGuest={continueAsGuest}
        />
      ) : activeParty ? (
        <WatchRoom mode={mode} user={user} party={activeParty} onLeave={handleLeaveParty} />
      ) : (
        <LobbyPanel
          user={user}
          mode={mode}
          statusMessage={statusMessage}
          onSignOut={signOut}
          onCreateParty={handleCreateParty}
          onJoinParty={handleJoinParty}
        />
      )}
    </main>
  );
}
