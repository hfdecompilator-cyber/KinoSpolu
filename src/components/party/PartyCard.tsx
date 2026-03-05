import { Link } from 'react-router-dom';
import { getServiceConfig } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Party } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';

interface PartyCardProps {
  party: Party;
  showJoinButton?: boolean;
}

export function PartyCard({ party, showJoinButton = true }: PartyCardProps) {
  const { user } = useAuthStore();
  const { canJoinParty, joinParty } = usePartyStore();
  const service = getServiceConfig(party.service);

  const isMember = party.members.some((m) => m.userId === user?.id);
  const canJoin = canJoinParty(party);
  const isFull = party.members.length >= party.maxMembers;

  const statusColors = {
    waiting: 'bg-yellow-500/20 text-yellow-300',
    watching: 'bg-green-500/20 text-green-300',
    paused: 'bg-orange-500/20 text-orange-300',
    ended: 'bg-red-500/20 text-red-300',
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    joinParty(party.id);
  };

  const getJoinMessage = () => {
    if (!user) return 'Sign in to join';
    if (isMember) return null;
    if (isFull) return 'Party is full';
    if (!canJoin) return `Connect ${service.name} to join`;
    return null;
  };

  const joinMessage = getJoinMessage();

  return (
    <Link
      to={isMember ? `/watch/${party.id}` : canJoin ? `/watch/${party.id}` : '#'}
      className="group block"
    >
      <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5">
        <div className="relative h-40 overflow-hidden">
          <img
            src={party.thumbnailUrl}
            alt={party.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant="service"
              style={{ backgroundColor: service.color + '33', borderColor: service.color }}
              className="border"
            >
              {service.icon} {service.name}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[party.status]}`}>
              {party.status === 'waiting' ? '⏳ Waiting' : party.status === 'watching' ? '▶️ Live' : party.status === 'paused' ? '⏸ Paused' : '🔴 Ended'}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-semibold text-lg truncate">{party.name}</h3>
            {party.contentTitle && (
              <p className="text-white/60 text-sm truncate">{party.contentTitle}</p>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar userId={party.hostId} displayName={party.hostDisplayName} size="sm" />
              <div>
                <div className="text-sm text-white/80">{party.hostDisplayName}</div>
                <div className="text-xs text-white/40">Host</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">
                {party.members.length}/{party.maxMembers}
              </div>
              <div className="text-xs text-white/40">members</div>
            </div>
          </div>

          {party.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {party.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          {showJoinButton && !isMember && (
            <div className="mt-2">
              {canJoin ? (
                <Button onClick={handleJoin} size="sm" className="w-full">
                  Join Party
                </Button>
              ) : (
                <div className="text-center text-xs text-white/40 py-2 px-3 bg-white/5 rounded-lg">
                  {joinMessage}
                </div>
              )}
            </div>
          )}

          {isMember && (
            <Button variant="secondary" size="sm" className="w-full mt-2">
              {party.hostId === user?.id ? 'Manage Party' : 'Rejoin Party'}
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
