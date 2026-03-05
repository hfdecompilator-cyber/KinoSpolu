import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatClock, nowIso } from "../lib/utils";
import { supabase } from "../lib/supabase";
import type {
  AppMode,
  AppUser,
  ChatMessage,
  Participant,
  Party,
  PlaybackAction,
} from "../types";

interface WatchRoomProps {
  mode: AppMode;
  user: AppUser;
  party: Party;
  onLeave: () => void;
}

type DemoBroadcast =
  | { type: "chat"; message: ChatMessage }
  | { type: "playback"; action: PlaybackAction; at: number; senderId: string }
  | { type: "presence"; participant: Participant }
  | { type: "leave"; id: string };

interface ChatRow {
  id: string;
  party_code: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface PlaybackRow {
  sender_id: string;
  action: PlaybackAction;
  current_time: number;
}

interface PresenceMeta {
  name?: string;
  is_host?: boolean;
  joined_at?: string;
}

interface RealtimeInsertPayload<T> {
  new: T;
}

function mapChatRow(row: ChatRow): ChatMessage {
  return {
    id: String(row.id),
    partyCode: row.party_code,
    senderId: row.sender_id,
    senderName: row.sender_name,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function WatchRoom({ mode, user, party, onLeave }: WatchRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [roomStatus, setRoomStatus] = useState<string | null>(null);
  const [voiceJoined, setVoiceJoined] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const isHost = user.id === party.hostUserId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const listBottomRef = useRef<HTMLDivElement | null>(null);
  const ignoreLocalPlaybackEvent = useRef(false);
  const demoChannelRef = useRef<BroadcastChannel | null>(null);

  const voiceRoomUrl = useMemo(() => {
    const room = encodeURIComponent(`watchparty-${party.code}`);
    return `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithVideoMuted=true`;
  }, [party.code]);

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setParticipants([
      {
        id: user.id,
        name: user.name,
        isHost,
        joinedAt: nowIso(),
      },
    ]);

    if (mode !== "live" || !supabase) return;

    let mounted = true;
    const channelIds: string[] = [];

    const loadData = async () => {
      const { data: chatData, error: chatError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("party_code", party.code)
        .order("created_at", { ascending: true })
        .limit(200);

      if (chatError) {
        setRoomStatus(chatError.message);
      } else if (mounted && chatData) {
        setMessages(chatData.map((row) => mapChatRow(row as ChatRow)));
      }

      const chatChannel = supabase
        .channel(`party-chat-${party.code}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `party_code=eq.${party.code}`,
          },
          (payload) => {
            const row = (payload as RealtimeInsertPayload<ChatRow>).new;
            setMessages((prev) => [...prev, mapChatRow(row)]);
          },
        )
        .subscribe();

      channelIds.push(chatChannel.topic);

      const playbackChannel = supabase
        .channel(`party-playback-${party.code}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "playback_events",
            filter: `party_code=eq.${party.code}`,
          },
          (payload) => {
            const row = (payload as RealtimeInsertPayload<PlaybackRow>).new;
            if (row.sender_id === user.id) return;
            applyRemotePlayback(row.action as PlaybackAction, Number(row.current_time || 0));
          },
        )
        .subscribe();

      channelIds.push(playbackChannel.topic);

      const presenceChannel = supabase.channel(`party-presence-${party.code}`, {
        config: {
          presence: { key: user.id },
        },
      });

      presenceChannel.on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as Record<string, PresenceMeta[]>;
        const nextParticipants = Object.entries(state).map(([id, metas]) => {
          const meta = metas[0] || {};
          return {
            id,
            name: meta.name || "Viewer",
            isHost: Boolean(meta.is_host),
            joinedAt: meta.joined_at || nowIso(),
          } as Participant;
        });
        setParticipants(nextParticipants);
      });

      presenceChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            name: user.name,
            is_host: isHost,
            joined_at: nowIso(),
          });
        }
      });

      channelIds.push(presenceChannel.topic);
    };

    void loadData();

    return () => {
      mounted = false;
      for (const topic of channelIds) {
        const channel = supabase.getChannels().find((candidate) => candidate.topic === topic);
        if (channel) void supabase.removeChannel(channel);
      }
    };
  }, [isHost, mode, party.code, user.id, user.name]);

  useEffect(() => {
    if (mode !== "demo") return;

    const channel = new BroadcastChannel(`demo-party-${party.code}`);
    demoChannelRef.current = channel;

    const chatStorageKey = `demo_chat_${party.code}`;
    const cachedChat = localStorage.getItem(chatStorageKey);
    if (cachedChat) {
      try {
        setMessages(JSON.parse(cachedChat) as ChatMessage[]);
      } catch {
        setMessages([]);
      }
    }

    channel.onmessage = (event: MessageEvent<DemoBroadcast>) => {
      const payload = event.data;
      if (!payload) return;

      if (payload.type === "chat") {
        setMessages((prev) => {
          const next = [...prev, payload.message];
          localStorage.setItem(chatStorageKey, JSON.stringify(next.slice(-200)));
          return next.slice(-200);
        });
        return;
      }

      if (payload.type === "playback" && payload.senderId !== user.id) {
        applyRemotePlayback(payload.action, payload.at);
        return;
      }

      if (payload.type === "presence") {
        setParticipants((prev) => {
          const withoutCurrent = prev.filter((item) => item.id !== payload.participant.id);
          return [...withoutCurrent, payload.participant];
        });
        return;
      }

      if (payload.type === "leave") {
        setParticipants((prev) => prev.filter((item) => item.id !== payload.id));
      }
    };

    const sendPresence = () => {
      channel.postMessage({
        type: "presence",
        participant: {
          id: user.id,
          name: user.name,
          isHost,
          joinedAt: nowIso(),
        },
      } satisfies DemoBroadcast);
    };

    sendPresence();
    const heartbeat = window.setInterval(sendPresence, 4000);

    return () => {
      clearInterval(heartbeat);
      channel.postMessage({ type: "leave", id: user.id } satisfies DemoBroadcast);
      channel.close();
      demoChannelRef.current = null;
    };
  }, [isHost, mode, party.code, user.id, user.name]);

  const persistPlaybackEvent = async (action: PlaybackAction, at: number) => {
    if (ignoreLocalPlaybackEvent.current) return;

    if (mode === "live" && supabase) {
      const { error } = await supabase.from("playback_events").insert({
        party_code: party.code,
        sender_id: user.id,
        action,
        current_time: at,
      });
      if (error) setRoomStatus(error.message);
      return;
    }

    demoChannelRef.current?.postMessage({
      type: "playback",
      action,
      at,
      senderId: user.id,
    } satisfies DemoBroadcast);
  };

  const applyRemotePlayback = (action: PlaybackAction, at: number) => {
    const video = videoRef.current;
    if (!video) return;

    ignoreLocalPlaybackEvent.current = true;
    if (Math.abs(video.currentTime - at) > 1) video.currentTime = at;

    if (action === "play") {
      void video.play().catch(() => null);
    } else if (action === "pause") {
      video.pause();
    }

    window.setTimeout(() => {
      ignoreLocalPlaybackEvent.current = false;
    }, 200);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = messageInput.trim();
    if (!text) return;
    setMessageInput("");

    if (mode === "live" && supabase) {
      const { error } = await supabase.from("chat_messages").insert({
        party_code: party.code,
        sender_id: user.id,
        sender_name: user.name,
        message: text,
      });
      if (error) setRoomStatus(error.message);
      return;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      partyCode: party.code,
      senderId: user.id,
      senderName: user.name,
      message: text,
      createdAt: nowIso(),
    };

    setMessages((prev) => {
      const next = [...prev, message];
      localStorage.setItem(`demo_chat_${party.code}`, JSON.stringify(next.slice(-200)));
      return next.slice(-200);
    });
    demoChannelRef.current?.postMessage({ type: "chat", message } satisfies DemoBroadcast);
  };

  return (
    <section className="card wide">
      <header className="row spread wrap">
        <div>
          <p className="label">Now watching</p>
          <h2>{party.title}</h2>
          <p className="muted">
            Code <strong>{party.code}</strong> · Host {party.hostName}
          </p>
        </div>
        <div className="row">
          <button
            className="ghost"
            onClick={() => {
              void navigator.clipboard.writeText(party.code);
              setRoomStatus("Party code copied.");
            }}
          >
            Copy code
          </button>
          <button className="secondary" onClick={onLeave}>
            Leave party
          </button>
        </div>
      </header>

      <div className="watch-grid">
        <div className="player-panel">
          <video
            ref={videoRef}
            className="player"
            src={party.videoUrl}
            controls={isHost}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={(event) => void persistPlaybackEvent("play", event.currentTarget.currentTime)}
            onPause={(event) => void persistPlaybackEvent("pause", event.currentTarget.currentTime)}
            onSeeked={(event) => void persistPlaybackEvent("seek", event.currentTarget.currentTime)}
          />
          <div className="row spread">
            <p className="muted">
              {isHost
                ? "Host controls playback for everyone."
                : "Viewing synced playback from host controls."}
            </p>
            <p className="small">{formatClock(currentTime)}</p>
          </div>

          <section className="panel stack">
            <div className="row spread">
              <h3>Voice room</h3>
              <button className="ghost" onClick={() => setVoiceJoined((prev) => !prev)}>
                {voiceJoined ? "Hide voice room" : "Join voice room"}
              </button>
            </div>
            <p className="muted small">
              Voice chat runs in an embedded Jitsi room tied to this party code.
            </p>
            {voiceJoined ? (
              <iframe
                title="voice-room"
                src={voiceRoomUrl}
                className="voice-iframe"
                allow="camera; microphone; fullscreen; speaker-selection"
              />
            ) : null}
          </section>
        </div>

        <aside className="stack">
          <section className="panel stack">
            <h3>Live chat</h3>
            <div className="chat-list">
              {messages.map((message) => (
                <div key={message.id} className="chat-item">
                  <p className="small">
                    <strong>{message.senderName}</strong> ·{" "}
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                  <p>{message.message}</p>
                </div>
              ))}
              <div ref={listBottomRef} />
            </div>
            <form className="row" onSubmit={sendMessage}>
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Drop a reaction..."
              />
              <button className="primary" type="submit">
                Send
              </button>
            </form>
          </section>

          <section className="panel">
            <h3>Participants ({participants.length})</h3>
            <ul className="participant-list">
              {participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.isHost ? <span className="badge">Host</span> : null}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {roomStatus ? <div className="callout">{roomStatus}</div> : null}
    </section>
  );
}
