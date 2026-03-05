import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { ChatPanel } from '@/components/party/ChatPanel';
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

  useEffect(() => {
    if (partyId) {
      setCurrentParty(partyId);
    }
    return () => setCurrentParty(null);
  }, [partyId, setCurrentParty]);

  if (!currentParty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-3">Party not found</h1>
        <p className="text-white/50 mb-6">This party may have ended or doesn't exist.</p>
        <Link to="/discover">
          <Button>Browse Parties</Button>
        </Link>
      </div>
    );
  }

  const service = getServiceConfig(currentParty.service);
  const isMember = currentParty.members.some((m) => m.userId === user?.id);
  const isHost = currentParty.hostId === user?.id;
  const canJoin = user ? canJoinParty(currentParty) : false;

  const handleJoin = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
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
          {user
            ? `Connect ${service.name} on your profile to join this party`
            : 'Sign in and connect your streaming services to join'}
        </p>
        {user ? (
          <Link to="/profile">
            <Button>Connect {service.name}</Button>
          </Link>
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
        <div className="flex items-center justify-center gap-4 mb-6 text-sm text-white/40">
          <span>Hosted by {currentParty.hostDisplayName}</span>
          <span>•</span>
          <span>{currentParty.members.length}/{currentParty.maxMembers} members</span>
          <span>•</span>
          <span>{service.name}</span>
        </div>
        <Button onClick={handleJoin} size="lg">
          Join Party
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1 bg-black flex items-center justify-center">
          <img
            src={currentParty.thumbnailUrl}
            alt={currentParty.name}
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-lg"
          />
          <div className="relative z-10 text-center p-8">
            <div className="text-6xl mb-4">{service.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentParty.contentTitle || currentParty.name}
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Watching on {service.name}
            </p>
            <div className="flex items-center justify-center gap-4">
              {isHost && currentParty.status === 'waiting' && (
                <Button onClick={() => updatePartyStatus(currentParty.id, 'watching')}>
                  ▶ Start Watching
                </Button>
              )}
              {isHost && currentParty.status === 'watching' && (
                <Button onClick={() => updatePartyStatus(currentParty.id, 'paused')} variant="secondary">
                  ⏸ Pause
                </Button>
              )}
              {isHost && currentParty.status === 'paused' && (
                <Button onClick={() => updatePartyStatus(currentParty.id, 'watching')}>
                  ▶ Resume
                </Button>
              )}
              {currentParty.status === 'watching' && (
                <Badge variant="success" className="text-sm px-3 py-1">
                  ● Live
                </Badge>
              )}
              {currentParty.status === 'waiting' && (
                <Badge variant="warning" className="text-sm px-3 py-1">
                  ⏳ Waiting for host
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-900/90 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-semibold text-white text-sm">{currentParty.name}</h3>
                <p className="text-xs text-white/40">
                  {currentParty.members.length} member{currentParty.members.length !== 1 ? 's' : ''} ·{' '}
                  {service.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowInvite(!showInvite)}
              >
                📋 Invite
              </Button>
              {isHost && currentParty.status !== 'ended' && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updatePartyStatus(currentParty.id, 'ended')}
                >
                  End Party
                </Button>
              )}
              {!isHost && (
                <Button size="sm" variant="ghost" onClick={handleLeave}>
                  Leave
                </Button>
              )}
            </div>
          </div>

          {showInvite && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-white/50 mb-1">Invite Code</p>
                <p className="text-lg font-mono font-bold text-white tracking-widest">
                  {currentParty.inviteCode}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={copyInviteCode}>
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-80 border-l border-white/10 bg-slate-900/50 flex flex-col">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-white text-sm mb-3">
            Members ({currentParty.members.length}/{currentParty.maxMembers})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {currentParty.members.map((member) => (
              <div key={member.userId} className="flex items-center gap-2">
                <Avatar userId={member.userId} displayName={member.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{member.displayName}</p>
                </div>
                {member.isHost && (
                  <Badge variant="default" className="text-[10px]">Host</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatPanel partyId={currentParty.id} messages={currentParty.messages} />
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
