import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { ChatPanel } from '@/components/party/ChatPanel';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { ReactionOverlay } from '@/components/party/ReactionOverlay';
import { MoodSelector, MOOD_THEMES } from '@/components/party/MoodSelector';
import { ViewerSyncBar } from '@/components/party/ViewerSyncBar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getServiceConfig } from '@/lib/constants';
import { AuthModal } from '@/components/auth/AuthModal';

export function WatchPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCurrentParty, currentParty, joinParty, leaveParty, updatePartyStatus, canJoinParty } = usePartyStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mood, setMood] = useState('default');
  const [mobilePanel, setMobilePanel] = useState<'none' | 'chat' | 'members'>('none');

  useEffect(() => {
    if (partyId) setCurrentParty(partyId);
    return () => setCurrentParty(null);
  }, [partyId, setCurrentParty]);

  if (!currentParty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-3">Party not found</h1>
        <p className="text-white/50 mb-6">This party may have ended or doesn't exist.</p>
        <Link to="/discover"><Button>Browse Parties</Button></Link>
      </div>
    );
  }

  const service = getServiceConfig(currentParty.service);
  const isMember = currentParty.members.some((m) => m.userId === user?.id);
  const isHost = currentParty.hostId === user?.id;
  const canJoin = user ? canJoinParty(currentParty) : false;
  const moodTheme = MOOD_THEMES.find((m) => m.id === mood) || MOOD_THEMES[0];
  const isPlaying = currentParty.status === 'watching';

  const handleJoin = () => {
    if (!user) { setShowAuth(true); return; }
    joinParty(currentParty.id);
    setCurrentParty(currentParty.id);
  };

  const handleLeave = () => {
    leaveParty(currentParty.id);
    navigate('/discover');
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentParty.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMember && !canJoin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">{service.icon}</div>
        <h1 className="text-2xl font-bold text-white mb-3">{currentParty.name}</h1>
        <p className="text-white/50 mb-2">This party requires {service.name}</p>
        <p className="text-sm text-white/40 mb-6">
          {user ? `Connect ${service.name} on your profile to join` : 'Sign in and connect your streaming services to join'}
        </p>
        {user ? (
          <Link to="/profile"><Button>Connect {service.name}</Button></Link>
        ) : (
          <Button onClick={() => setShowAuth(true)}>Sign In</Button>
        )}
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">{service.icon}</div>
        <h1 className="text-2xl font-bold text-white mb-3">{currentParty.name}</h1>
        <p className="text-white/50 mb-2">{currentParty.description}</p>
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 text-sm text-white/40 flex-wrap">
          <span>Hosted by {currentParty.hostDisplayName}</span>
          <span className="hidden sm:inline">•</span>
          <span>{currentParty.members.length}/{currentParty.maxMembers} members</span>
          <span className="hidden sm:inline">•</span>
          <span>{service.name}</span>
        </div>
        <Button onClick={handleJoin} size="lg">Join Party</Button>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex flex-col md:flex-row bg-gradient-to-br ${moodTheme.gradient} ${moodTheme.glow}`}>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-[200px] sm:min-h-[300px]">
          <VideoPlayer
            thumbnailUrl={currentParty.thumbnailUrl}
            contentTitle={currentParty.contentTitle || currentParty.name}
            serviceName={service.name}
            serviceIcon={service.icon}
            isPlaying={isPlaying}
          >
            <ReactionOverlay />

            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                {currentParty.status === 'watching' && (
                  <Badge variant="success" className="text-xs px-2 py-0.5 bg-green-500/20 backdrop-blur-md border border-green-500/30">
                    ● LIVE
                  </Badge>
                )}
                {currentParty.status === 'waiting' && (
                  <Badge variant="warning" className="text-xs px-2 py-0.5 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30">
                    ⏳ Waiting
                  </Badge>
                )}
                {currentParty.status === 'paused' && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20">
                    ⏸ Paused
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ViewerSyncBar members={currentParty.members} isPlaying={isPlaying} />
              </div>
            </div>

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center p-6 sm:p-8">
                  <div className="text-5xl sm:text-6xl mb-4">{service.icon}</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {currentParty.contentTitle || currentParty.name}
                  </h2>
                  <p className="text-white/50 text-sm mb-4 sm:mb-6">Watching on {service.name}</p>
                  {isHost && currentParty.status === 'waiting' && (
                    <Button onClick={() => updatePartyStatus(currentParty.id, 'watching')} size="lg">
                      ▶ Start Watching
                    </Button>
                  )}
                  {isHost && currentParty.status === 'paused' && (
                    <Button onClick={() => updatePartyStatus(currentParty.id, 'watching')}>
                      ▶ Resume
                    </Button>
                  )}
                </div>
              </div>
            )}
          </VideoPlayer>
        </div>

        <div className="border-t border-white/10 bg-slate-900/90 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <MoodSelector currentMood={mood} onMoodChange={setMood} />
              <div className="min-w-0">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{currentParty.name}</h3>
                <p className="text-[10px] sm:text-xs text-white/40 truncate">
                  {currentParty.members.length} member{currentParty.members.length !== 1 ? 's' : ''} · {service.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isHost && isPlaying && (
                <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => updatePartyStatus(currentParty.id, 'paused')}>
                  ⏸ Pause
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowInvite(!showInvite)} className="text-xs sm:text-sm">
                📋 <span className="hidden sm:inline">Invite</span>
              </Button>
              {isHost && currentParty.status !== 'ended' && (
                <Button size="sm" variant="danger" onClick={() => updatePartyStatus(currentParty.id, 'ended')} className="hidden sm:inline-flex">
                  End
                </Button>
              )}
              {!isHost && (
                <Button size="sm" variant="ghost" onClick={handleLeave} className="text-xs sm:text-sm">
                  Leave
                </Button>
              )}

              <button
                onClick={() => setMobilePanel(mobilePanel === 'members' ? 'none' : 'members')}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </button>
              <button
                onClick={() => setMobilePanel(mobilePanel === 'chat' ? 'none' : 'chat')}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </button>
            </div>
          </div>

          {showInvite && (
            <div className="mt-2 p-2 sm:p-3 bg-white/5 rounded-xl flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs text-white/50 mb-0.5">Invite Code</p>
                <p className="text-base sm:text-lg font-mono font-bold text-white tracking-widest">{currentParty.inviteCode}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={copyInviteCode}>
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex w-80 border-l border-white/10 bg-slate-900/50 flex-col">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <h3 className="font-semibold text-white text-sm mb-2 sm:mb-3">
            Members ({currentParty.members.length}/{currentParty.maxMembers})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
            {currentParty.members.map((member) => (
              <div key={member.userId} className="flex items-center gap-2">
                <div className="relative">
                  <Avatar userId={member.userId} displayName={member.displayName} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{member.displayName}</p>
                </div>
                {member.isHost && <Badge variant="default" className="text-[10px]">Host</Badge>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel partyId={currentParty.id} messages={currentParty.messages} />
        </div>
      </div>

      {mobilePanel !== 'none' && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col" style={{ height: '55vh' }}>
          <div
            className="flex-shrink-0 h-8 flex items-center justify-center cursor-pointer bg-slate-800/95 backdrop-blur-xl rounded-t-2xl border-t border-white/10"
            onClick={() => setMobilePanel('none')}
          >
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>
          <div className="flex-1 bg-slate-900/98 backdrop-blur-xl overflow-hidden flex flex-col">
            {mobilePanel === 'members' && (
              <div className="p-4 overflow-y-auto">
                <h3 className="font-semibold text-white text-sm mb-3">
                  Members ({currentParty.members.length}/{currentParty.maxMembers})
                </h3>
                <div className="space-y-3">
                  {currentParty.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <div className="relative">
                        <Avatar userId={member.userId} displayName={member.displayName} size="md" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{member.displayName}</p>
                        <p className="text-[11px] text-white/40">@{member.username}</p>
                      </div>
                      {member.isHost && <Badge variant="default">Host</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mobilePanel === 'chat' && (
              <ChatPanel partyId={currentParty.id} messages={currentParty.messages} />
            )}
          </div>
        </div>
      )}

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
