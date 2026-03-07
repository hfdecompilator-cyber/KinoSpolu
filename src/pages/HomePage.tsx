import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { ALL_SERVICES, svcInfo } from '@/types';
import type { Service } from '@/types';

export function HomePage() {
  const { user, signOut, getPublicLobbies, createLobby, joinByCode, connectService, disconnectService, canJoin } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'create' | 'join' | 'services'>('create');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [service, setService] = useState<Service>('youtube');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const connected = user?.connectedServices || [];
  const publicLobbies = getPublicLobbies();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!connected.includes(service)) { setError(`Connect ${svcInfo(service).name} first`); return; }
    if (!title.trim()) { setError('Enter a room name'); return; }
    if (service === 'youtube' && !url.trim()) { setError('Paste a YouTube URL'); return; }
    const lobby = createLobby(title.trim(), url.trim(), service, visibility);
    navigate(`/room/${lobby.id}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (joinCode.trim().length < 4) { setError('Enter a valid room code'); return; }
    const lobby = joinByCode(joinCode.trim());
    if (!lobby) { setError('Room not found or expired'); return; }
    navigate(`/room/${lobby.id}`);
  };

  const toggleService = (svc: Service) => {
    if (connected.includes(svc)) disconnectService(svc);
    else connectService(svc);
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/6 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 glass-strong">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">G</div>
          <span className="font-bold text-white text-base hidden sm:block">GlassSync</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="glass rounded-full px-3 py-1 text-xs text-white/60 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">{user?.avatar}</span>
            <span className="hidden sm:inline">{user?.name}</span>
          </span>
          <button onClick={signOut} className="text-[11px] text-white/30 hover:text-white/60 transition-colors px-2">Sign out</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 sm:pt-8 pb-24">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Hey, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-white/40 mb-1">
          {connected.length} service{connected.length !== 1 ? 's' : ''} connected
        </p>
        <p className="text-xs text-white/25 mb-6">
          {connected.length === 0 ? 'Connect a service below to create rooms' : connected.map((s) => svcInfo(s).icon).join(' ')}
        </p>

        <div className="flex gap-1 glass rounded-xl p-1 mb-6">
          {(['create', 'join', 'services'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t === 'create' ? '+ Create' : t === 'join' ? '🔗 Join' : '⚙ Services'}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="glass-strong rounded-2xl p-5 space-y-4 fade-up">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Service</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_SERVICES.slice(0, 10).map((s) => {
                  const isConn = connected.includes(s.id);
                  const isSel = service === s.id;
                  return (
                    <button key={s.id} type="button" disabled={!isConn}
                      onClick={() => setService(s.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-all ${
                        isSel ? 'bg-indigo-600/30 text-white border border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : isConn ? 'glass text-white/60 hover:bg-white/[0.08]'
                        : 'bg-white/[0.02] text-white/20 cursor-not-allowed'
                      }`}>
                      <span className="text-base">{s.icon}</span>
                      <span className="truncate w-full text-center">{s.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
              {connected.length === 0 && <p className="text-[11px] text-yellow-400/70 mt-2">→ Go to Services tab to connect first</p>}
            </div>

            <input className="input-glass" placeholder="Room name" value={title} onChange={(e) => setTitle(e.target.value)} required />

            {service === 'youtube' && (
              <input className="input-glass" placeholder="Paste YouTube URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            )}
            {service !== 'youtube' && (
              <input className="input-glass" placeholder="What are you watching? (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
            )}

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Room Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setVisibility('private')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${visibility === 'private' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'glass text-white/40'}`}>
                  🔒 Private
                </button>
                <button type="button" onClick={() => setVisibility('public')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${visibility === 'public' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'glass text-white/40'}`}>
                  🌐 Public
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={connected.length === 0}>Create Room</button>
          </form>
        )}

        {tab === 'join' && (
          <div className="space-y-4 fade-up">
            <form onSubmit={handleJoin} className="glass-strong rounded-2xl p-5 space-y-4">
              <p className="text-sm text-white/50">Enter an invite code</p>
              <input
                className="input-glass text-center text-2xl font-mono tracking-[0.3em] uppercase"
                placeholder="ABC123"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" className="btn-primary w-full">Join Room</button>
            </form>

            {publicLobbies.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Public Rooms</h3>
                <div className="space-y-2">
                  {publicLobbies.map((l) => {
                    const canJ = canJoin(l);
                    const info = svcInfo(l.service);
                    return (
                      <button key={l.id} onClick={() => { if (canJ) { navigate(`/room/${l.id}`); } }}
                        disabled={!canJ}
                        className={`w-full glass-strong rounded-xl p-3 text-left transition-all ${canJ ? 'hover:bg-white/[0.08]' : 'opacity-50 cursor-not-allowed'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/50">{info.icon} {info.name}</span>
                          <span className="text-[10px] text-white/25">{l.members.length} in room</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{l.title}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{l.hostName} · {l.code}</p>
                        {!canJ && <p className="text-[10px] text-yellow-400/60 mt-1">Connect {info.name} to join</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div className="glass-strong rounded-2xl p-5 fade-up">
            <h3 className="text-sm font-semibold text-white mb-1">Connected Services</h3>
            <p className="text-xs text-white/40 mb-4">Toggle services to create or join matching rooms</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SERVICES.map((s) => {
                const isConn = connected.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      isConn ? 'bg-indigo-600/10 border-indigo-500/30' : 'glass border-white/[0.06] hover:bg-white/[0.05]'
                    }`}>
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1 text-left">
                      <p className={`text-xs font-medium ${isConn ? 'text-white' : 'text-white/50'}`}>{s.name}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isConn ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                      {isConn && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
