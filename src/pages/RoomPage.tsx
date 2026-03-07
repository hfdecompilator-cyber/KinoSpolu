import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { svcInfo } from '@/types';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, setCurrent, current, joinLobby, leaveLobby, setStatus, sendMsg, canJoin } = useStore();
  const [msg, setMsg] = useState('');
  const [showPanel, setShowPanel] = useState<'none' | 'chat' | 'members'>('none');
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) { setCurrent(roomId); joinLobby(roomId); setCurrent(roomId); }
    return () => setCurrent(null);
  }, [roomId, setCurrent, joinLobby]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [current?.messages.length, showPanel]);

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-strong rounded-2xl p-8 text-center max-w-sm fade-up">
          <p className="text-4xl mb-3">🔍</p>
          <h2 className="text-lg font-bold text-white mb-2">Room not found</h2>
          <p className="text-sm text-white/40 mb-4">This room may have ended</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const svc = svcInfo(current.service);
  const isHost = current.hostId === user?.id;
  const isYT = current.service === 'youtube';
  const isPlaying = current.status === 'playing';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    sendMsg(msg.trim());
    setMsg('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#080b14]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 bg-black min-h-[200px] sm:min-h-[300px]">
          {isYT && current.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${current.videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
              <div className="text-center p-6 fade-up">
                <div className="text-5xl sm:text-6xl mb-4">{svc.icon}</div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{current.title}</h2>
                <p className="text-sm text-white/40 mb-1">{svc.name} Watch Party</p>
                {current.videoUrl && <p className="text-xs text-white/25 mb-4 truncate max-w-xs">{current.videoUrl}</p>}
                {isHost && current.status === 'waiting' && (
                  <button onClick={() => setStatus('playing')} className="btn-primary mt-2">▶ Start Watching</button>
                )}
                {!isHost && current.status === 'waiting' && (
                  <p className="text-xs text-white/30 mt-4">Waiting for host to start...</p>
                )}
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <button onClick={() => navigate('/')} className="glass rounded-full w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-xs">←</button>
            {current.status === 'playing' && (
              <span className="glass rounded-full px-2.5 py-1 text-[10px] text-green-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
              </span>
            )}
            {current.status === 'waiting' && <span className="glass rounded-full px-2.5 py-1 text-[10px] text-yellow-300">⏳ Waiting</span>}
            {current.status === 'paused' && <span className="glass rounded-full px-2.5 py-1 text-[10px] text-orange-300">⏸ Paused</span>}
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span className="glass rounded-full px-2.5 py-1 text-[10px] text-white/60 flex items-center gap-1">
              👥 {current.members.length}
            </span>
          </div>
        </div>

        <div className="glass-strong px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white truncate">{current.title}</h3>
            <p className="text-[10px] text-white/30">{svc.icon} {svc.name} · {current.hostName}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={copyCode} className="btn-glass text-[11px] px-2.5 py-1.5">
              {copied ? '✓ Copied' : `📋 ${current.code}`}
            </button>
            {isHost && isPlaying && <button onClick={() => setStatus('paused')} className="btn-glass text-[11px] px-2.5 py-1.5">⏸</button>}
            {isHost && current.status === 'paused' && <button onClick={() => setStatus('playing')} className="btn-glass text-[11px] px-2.5 py-1.5">▶</button>}
            {isHost && current.status !== 'ended' && <button onClick={() => { setStatus('ended'); navigate('/'); }} className="btn-glass text-[11px] px-2.5 py-1.5 text-red-300 hidden sm:block">End</button>}
            <button onClick={() => { leaveLobby(); navigate('/'); }} className="btn-glass text-[11px] px-2.5 py-1.5 text-red-300">✕</button>
            <button onClick={() => setShowPanel(showPanel === 'chat' ? 'none' : 'chat')} className="md:hidden btn-glass text-[11px] px-2.5 py-1.5">💬</button>
            <button onClick={() => setShowPanel(showPanel === 'members' ? 'none' : 'members')} className="md:hidden btn-glass text-[11px] px-2.5 py-1.5">👥</button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-72 lg:w-80 flex-col border-l border-white/[0.06] bg-[#0a0e18]">
        <div className="px-3 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs font-semibold text-white/50">Members · {current.members.length}</span>
          <div className="flex flex-wrap gap-1 mt-2">
            {current.members.map((m) => (
              <div key={m.userId} className="glass rounded-lg px-2 py-1 text-[10px] text-white/60 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[7px] text-white font-bold">{m.avatar}</span>
                {m.name.split(' ')[0]}{m.isHost && <span className="text-indigo-400 ml-0.5">★</span>}
              </div>
            ))}
          </div>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
          {current.messages.map((m) => {
            if (m.type === 'system') return <div key={m.id} className="text-center py-0.5"><span className="text-[10px] text-white/20">{m.text}</span></div>;
            const own = m.userId === user?.id;
            return (
              <div key={m.id} className={`flex gap-1.5 ${own ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%]`}>
                  <span className={`text-[9px] text-white/20 ${own ? 'float-right' : ''}`}>{m.name}</span>
                  <div className={`mt-0.5 px-3 py-1.5 rounded-2xl text-xs clear-both ${own ? 'bg-indigo-600/40 text-white rounded-tr-sm' : 'glass text-white/80 rounded-tl-sm'}`}>{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSend} className="p-2 border-t border-white/[0.06] flex gap-1.5">
          <input className="input-glass flex-1 text-xs py-2" placeholder="Message..." value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button type="submit" disabled={!msg.trim()} className="btn-primary px-3 py-2 text-xs disabled:opacity-40">↑</button>
        </form>
      </div>

      {showPanel !== 'none' && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#0a0e18] border-t border-white/[0.06] rounded-t-2xl" style={{ height: '55vh' }}>
          <div className="h-7 flex items-center justify-center" onClick={() => setShowPanel('none')}>
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
          {showPanel === 'members' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-semibold text-white/50 mb-2">Members ({current.members.length})</h3>
              {current.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 glass rounded-xl p-3">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold">{m.avatar}</span>
                  <div className="flex-1"><p className="text-sm text-white">{m.name}</p></div>
                  {m.isHost && <span className="text-[10px] text-indigo-400 glass px-2 py-0.5 rounded-full">Host</span>}
                </div>
              ))}
            </div>
          )}
          {showPanel === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {current.messages.map((m) => {
                  if (m.type === 'system') return <div key={m.id} className="text-center py-0.5"><span className="text-[10px] text-white/20">{m.text}</span></div>;
                  const own = m.userId === user?.id;
                  return (
                    <div key={m.id} className={`flex gap-1.5 ${own ? 'flex-row-reverse' : ''}`}>
                      <div className="max-w-[80%]">
                        <span className={`text-[9px] text-white/20 ${own ? 'float-right' : ''}`}>{m.name}</span>
                        <div className={`mt-0.5 px-3 py-1.5 rounded-2xl text-xs clear-both ${own ? 'bg-indigo-600/40 text-white rounded-tr-sm' : 'glass text-white/80 rounded-tl-sm'}`}>{m.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="p-2 border-t border-white/[0.06] flex gap-1.5">
                <input className="input-glass flex-1 text-xs py-2" placeholder="Message..." value={msg} onChange={(e) => setMsg(e.target.value)} />
                <button type="submit" disabled={!msg.trim()} className="btn-primary px-3 py-2 text-xs disabled:opacity-40">↑</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
