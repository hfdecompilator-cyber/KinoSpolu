import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '@/store/room-store';
import { useNetflixStore } from '@/store/netflix-store';
import { formatTime, timeAgo } from '@/lib/utils';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Copy, Check, Users, MessageCircle, LogOut, Send, Wifi, WifiOff,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { currentRoom, isConnected, joinRoom, leaveRoom, updatePlayback, sendChat, connectSocket } = useRoomStore();
  const { selectedProfile, isAuthenticated } = useNetflixStore();
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [localPosition, setLocalPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const positionInterval = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !selectedProfile) {
      navigate('/');
      return;
    }

    if (code) {
      if (currentRoom?.code === code) {
        connectSocket(code);
      } else {
        joinRoom(code);
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [code]);

  useEffect(() => {
    if (currentRoom?.playback) {
      setLocalPosition(currentRoom.playback.position);
    }
  }, [currentRoom?.playback?.position]);

  // Simulate playback position ticking
  useEffect(() => {
    if (currentRoom?.playback?.playing) {
      positionInterval.current = setInterval(() => {
        setLocalPosition(p => p + 1);
      }, 1000);
    } else {
      if (positionInterval.current) clearInterval(positionInterval.current);
    }
    return () => { if (positionInterval.current) clearInterval(positionInterval.current); };
  }, [currentRoom?.playback?.playing]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentRoom?.chat?.length]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  const togglePlayback = () => {
    const playing = !currentRoom?.playback?.playing;
    updatePlayback({ playing, position: localPosition });
  };

  const seekForward = () => {
    const newPos = localPosition + 10;
    setLocalPosition(newPos);
    updatePlayback({ position: newPos });
  };

  const seekBack = () => {
    const newPos = Math.max(0, localPosition - 10);
    setLocalPosition(newPos);
    updatePlayback({ position: newPos });
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/browse');
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to room {code}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      {/* Header */}
      <header className="bg-black/90 border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="text-gray-400 hover:text-white transition">
            <ChevronLeft size={20} />
          </button>
          <svg viewBox="0 0 111 30" className="h-5 fill-[#E50914]">
            <path d="M105.06 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.03-13.622L94.174 0h5.25l3.03 7.906L105.593 0h5.25l-5.78 14.28zM90.91 0l-.003 23.654c-1.534.094-3.064.156-4.593.25L86.31 0h4.6zM81.22 3.844h-6.093V0H92v3.844h-6.094v20.093c-1.562.063-3.093.157-4.687.22V3.843zM68.75 13.735c2.093-.156 4.218-.375 6.344-.438V0h-4.687v9.78l-5.937-9.78h-5v23.406c1.5-.094 3-.22 4.5-.282V9.373l4.78 4.362zM53.69 0v23.313c3.094-.094 6.218-.313 9.343-.376V19.22h-4.687V13.22h4.687V9.375H58.34V3.75h4.687V0H53.69zM38.59 0l3.937 15.844L46.5 0h5.094L44.87 24.156c-1.532.063-3.032.094-4.563.22L33.53 0h5.06zM24.906 0v3.75h-4.687v15.47h4.687v3.718c-3.125.094-6.25.313-9.375.5V0h9.375zM10.625 0v20.72c-1.563.063-3.094.22-4.625.345V0h4.625zM5.28 0L0 20.844v3.375c3.156-.407 6.312-.72 9.468-.938V20.75H5.78L10.31 0H5.28z" />
          </svg>
          <span className="text-white/50 text-sm">Room</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Room code */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-3 py-1.5 transition"
          >
            <span className="text-white font-mono font-bold tracking-wider text-sm">{code}</span>
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
          </button>

          {/* Connection status */}
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-yellow-500'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">{isConnected ? 'Synced' : 'Reconnecting...'}</span>
          </div>

          {/* Participants count */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Users size={14} />
            <span>{currentRoom.participants.length}</span>
          </div>

          {/* Toggle chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-1.5 rounded transition ${showChat ? 'text-[#E50914]' : 'text-gray-400 hover:text-white'}`}
          >
            <MessageCircle size={18} />
          </button>

          <button onClick={handleLeave} className="text-gray-400 hover:text-[#E50914] transition" title="Leave room">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Player area */}
        <div className="flex-1 flex flex-col">
          {/* Video placeholder */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            {currentRoom.titleImage ? (
              <img
                src={currentRoom.titleImage}
                alt={currentRoom.title || ''}
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
              />
            ) : null}
            <div className="relative z-10 text-center px-4">
              {currentRoom.title ? (
                <>
                  <p className="text-white text-2xl md:text-4xl font-bold mb-2">{currentRoom.title}</p>
                  <p className="text-gray-400">Netflix Watch Party</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-lg mb-2">No title selected</p>
                  <p className="text-gray-600 text-sm">Content will sync when the host selects something</p>
                </>
              )}
            </div>

            {/* Playback position overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress bar */}
              <div className="w-full bg-white/20 rounded-full h-1 mb-3 cursor-pointer group">
                <div
                  className="bg-[#E50914] h-1 rounded-full relative transition-all"
                  style={{ width: `${Math.min(100, (localPosition / 3600) * 100)}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#E50914] rounded-full opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={seekBack} className="text-white/80 hover:text-white transition">
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={togglePlayback}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition"
                  >
                    {currentRoom.playback.playing ? (
                      <Pause size={20} className="text-black" />
                    ) : (
                      <Play size={20} className="text-black ml-0.5" />
                    )}
                  </button>
                  <button onClick={seekForward} className="text-white/80 hover:text-white transition">
                    <SkipForward size={20} />
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white/80 hover:text-white transition"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <span className="text-white/60 text-sm font-mono">
                    {formatTime(localPosition)} / 1:00:00
                  </span>
                </div>

                <div className="text-white/50 text-xs">
                  {currentRoom.playback.playing ? 'Playing' : 'Paused'}
                  {currentRoom.playback.updatedBy && ` · synced ${timeAgo(currentRoom.playback.updatedAt)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Participants bar */}
          <div className="bg-[#181818] border-t border-white/5 px-4 py-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-gray-500 text-xs shrink-0">Watching:</span>
              {currentRoom.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#333]">
                    {p.avatar ? (
                      <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold flex items-center justify-center h-full">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-white text-xs">
                    {p.name}
                    {p.isHost && <span className="text-[#E50914] ml-1">(host)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-white/10 bg-[#181818] flex flex-col overflow-hidden shrink-0"
            >
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Room Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {currentRoom.chat.length === 0 && (
                  <p className="text-gray-600 text-sm text-center mt-8">
                    No messages yet. Say hi!
                  </p>
                )}
                {currentRoom.chat.map((msg) => (
                  <div key={msg.id} className="group">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#E50914] text-xs font-semibold shrink-0">{msg.userName}</span>
                      <span className="text-gray-600 text-[10px]">{timeAgo(msg.timestamp)}</span>
                    </div>
                    <p className="text-white text-sm break-words">{msg.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/30 text-white rounded-md px-3 py-2 text-sm outline-none border border-white/10 focus:border-white/30 transition placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-[#E50914] hover:bg-[#F6121D] text-white p-2 rounded-md transition disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
