import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Send,
  Copy,
  CheckCircle2,
  Users,
  MessageSquare,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Lock,
  Globe,
} from 'lucide-react';
import type { Room, User, ChatMessage, RoomParticipant } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface RoomPageProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

type Tab = 'chat' | 'participants';

const COLORS = [
  '#E50914', '#7c3aed', '#0ea5e9', '#10b981',
  '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6',
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    roomId: '',
    userId: 'sys',
    username: 'System',
    message: '🎉 Room created! Share the code with your friends.',
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
];

export function RoomPage({ room, user, onLeave }: RoomPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES.map(m => ({ ...m, roomId: room.id })));
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('chat');
  const [codeCopied, setCodeCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>(
    room.participants || [
      {
        userId: user.id,
        username: user.username || user.email.split('@')[0],
        joinedAt: new Date().toISOString(),
        isHost: room.hostId === user.id,
        isReady: true,
      },
    ]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36),
      roomId: room.id,
      userId: user.id,
      username: user.username || user.email.split('@')[0],
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const isHost = room.hostId === user.id;

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-white/10 bg-[#111] px-4 py-3 flex items-center gap-3">
        <button
          onClick={onLeave}
          className="text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white truncate">{room.name}</h1>
            {room.isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-white/30" />
            )}
            {isHost && (
              <Badge variant="netflix" className="text-xs">Host</Badge>
            )}
          </div>
          {room.contentTitle && (
            <p className="text-xs text-[#a3a3a3] truncate">{room.contentTitle}</p>
          )}
        </div>

        {/* Room code */}
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <span className="font-mono text-sm font-bold text-[#E50914] tracking-widest">
            {room.code}
          </span>
          {codeCopied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-white/40" />
          )}
        </button>

        <div className="flex items-center gap-1 text-xs text-[#a3a3a3]">
          <Users className="w-3.5 h-3.5" />
          <span>{participants.length}/{room.maxParticipants}</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main: Netflix instructions + controls */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Netflix player instructions panel */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <div className="w-full max-w-2xl">
              {/* Netflix open button */}
              <div className="relative aspect-video bg-[#111] rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/5 to-transparent" />

                <div className="relative z-10 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#E50914]/20 flex items-center justify-center mx-auto mb-4">
                    <svg viewBox="0 0 111 30" className="h-7 w-auto" fill="#E50914">
                      <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.031-13.75L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.25V0zm-8.937 26.937c-4.078-.313-8.156-.5-12.297-.5V0h4.687v22.78c2.562.094 5.156.282 7.61.438v3.72zM64.375 10.656v3.595h-6.719V26.5h-4.656V0H64.75v3.625h-7.094v7.031h6.719zm-18.906-7.03h-4.844V27.75c1.563 0 3.156.031 4.719.063L45.469 3.625zM35.875 0h-4.656l-.031 19.625c-2-.313-3.969-.563-5.969-.782V0H20.5v22.594c4.25.532 8.438 1.282 12.563 2.156V0h2.812zm-18.313 22.28C12.218 21.656 6.75 21.28.999 21.28V0H5.62v17.875c3.625.125 7.188.5 10.719 1.063l1.223 3.342z" />
                    </svg>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">
                    {isPlaying ? `Watching: ${room.contentTitle || 'Netflix'}` : 'Open Netflix to Start Watching'}
                  </h2>
                  <p className="text-sm text-[#a3a3a3] mb-5 max-w-sm mx-auto">
                    {isPlaying
                      ? 'Netflix is open. Use the controls below to sync with your watch party.'
                      : room.contentUrl
                      ? `Open "${room.contentTitle}" on Netflix, then click Ready.`
                      : 'Open Netflix and navigate to what you want to watch, then click Ready.'}
                  </p>

                  <div className="flex gap-3 justify-center">
                    {room.contentUrl ? (
                      <a
                        href={room.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Button variant="netflix" className="gap-2 font-bold">
                          <ExternalLink className="w-4 h-4" />
                          Open on Netflix
                        </Button>
                      </a>
                    ) : (
                      <a
                        href="https://www.netflix.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Button variant="netflix" className="gap-2 font-bold">
                          <ExternalLink className="w-4 h-4" />
                          Open Netflix
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="outline"
                      className={`gap-2 border-white/20 ${
                        isPlaying ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-white/60'
                      }`}
                      onClick={() => setIsPlaying(p => !p)}
                    >
                      {isPlaying ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Ready
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          I'm Ready
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sync controls */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-xs text-[#a3a3a3]">
                    {isPlaying ? `${participants.filter(p => p.isReady).length}/${participants.length} ready` : 'Waiting for all to be ready'}
                  </span>
                </div>

                {isHost && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-white/60 hover:text-white gap-1.5 text-xs"
                      onClick={() => setIsPlaying(p => !p)}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pause All' : 'Play All'}
                    </Button>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-white/60 hover:text-white"
                  onClick={() => setIsMuted(m => !m)}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isMuted ? 'opacity-30' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: chat / participants */}
        <div className="w-80 border-l border-white/10 bg-[#111] flex flex-col">
          {/* Tabs */}
          <div className="shrink-0 flex border-b border-white/10">
            {([
              { id: 'chat' as Tab, label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { id: 'participants' as Tab, label: `People (${participants.length})`, icon: <Users className="w-3.5 h-3.5" /> },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-[#E50914] text-white'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}>
                        {msg.userId !== 'sys' && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold text-white"
                              style={{ backgroundColor: colorForUser(msg.userId) }}
                            >
                              {msg.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[80%] ${msg.userId === 'sys' ? 'w-full text-center' : ''}`}>
                          {msg.userId !== 'sys' && msg.userId !== user.id && (
                            <p className="text-xs font-medium mb-0.5" style={{ color: colorForUser(msg.userId) }}>
                              {msg.username}
                            </p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                              msg.userId === 'sys'
                                ? 'bg-white/5 text-[#a3a3a3] text-xs text-center mx-auto inline-block'
                                : msg.userId === user.id
                                ? 'bg-[#7c3aed] text-white rounded-tr-sm'
                                : 'bg-white/10 text-white rounded-tl-sm'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5 px-1">
                            {formatTimeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="shrink-0 p-3 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Say something…"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#7c3aed] text-sm h-9"
                    />
                    <Button
                      size="sm"
                      className="bg-[#7c3aed] hover:bg-[#6d28d9] h-9 w-9 p-0 shrink-0"
                      onClick={sendMessage}
                      disabled={!input.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="participants"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3"
              >
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.userId} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className="text-xs font-bold text-white"
                          style={{ backgroundColor: colorForUser(p.userId) }}
                        >
                          {p.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {p.username}
                          {p.userId === user.id && (
                            <span className="text-xs text-white/40 ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-[#a3a3a3]">
                          Joined {formatTimeAgo(p.joinedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.isHost && (
                          <Badge variant="netflix" className="text-xs">Host</Badge>
                        )}
                        <div className={`w-2 h-2 rounded-full ${p.isReady ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {participants.length < room.maxParticipants && (
                  <div className="mt-3 p-3 rounded-lg border border-dashed border-white/10 text-center">
                    <p className="text-xs text-[#555]">
                      Share code <span className="font-mono text-[#E50914]">{room.code}</span> to invite
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
