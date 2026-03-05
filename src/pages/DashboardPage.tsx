import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { NetflixConnectModal } from '@/components/netflix/NetflixConnectModal';
import {
  Plus,
  Users,
  Film,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
} from 'lucide-react';
import type { Room, User } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface DashboardPageProps {
  user: User;
  rooms: Room[];
  loadingRooms: boolean;
  onNetflixConnected: (profileName: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => Promise<Room | null>;
  onEnterRoom: (room: Room) => void;
  joinError: string | null;
}

const NetflixN = () => (
  <span className="font-black text-[#E50914] text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>
    N
  </span>
);

export function DashboardPage({
  user,
  rooms,
  loadingRooms,
  onNetflixConnected,
  onCreateRoom,
  onJoinRoom,
  onEnterRoom,
  joinError,
}: DashboardPageProps) {
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinLocalError, setJoinLocalError] = useState('');
  const [netflixModalOpen, setNetflixModalOpen] = useState(false);

  const displayJoinError = joinLocalError || joinError;

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setJoinLocalError('Enter a room code.');
      return;
    }
    if (joinCode.length !== 6) {
      setJoinLocalError('Room codes are 6 characters.');
      return;
    }
    setJoinLocalError('');
    setJoining(true);
    const room = await onJoinRoom(joinCode.toUpperCase());
    setJoining(false);
    if (room) {
      setJoinCode('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, {user.username || user.email.split('@')[0]}
          </h1>
          <p className="text-[#a3a3a3] text-sm">
            {user.netflixConnected
              ? `Netflix connected as "${user.netflixProfileName || 'Unknown'}"`
              : 'Connect your Netflix account to start watching.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Netflix status card */}
            <Card className="bg-[#141414] border-[#2a2a2a] overflow-hidden">
              <div className={`h-1 ${user.netflixConnected ? 'bg-[#E50914]' : 'bg-white/20'}`} />
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.netflixConnected ? 'bg-[#E50914]/20' : 'bg-white/5'}`}>
                    <NetflixN />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Netflix Account</p>
                    <p className={`text-xs truncate ${user.netflixConnected ? 'text-emerald-400' : 'text-[#a3a3a3]'}`}>
                      {user.netflixConnected
                        ? `${user.netflixProfileName || 'Connected'} · Active`
                        : 'Not connected'}
                    </p>
                  </div>
                  {user.netflixConnected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>

                {!user.netflixConnected ? (
                  <Button
                    variant="netflix"
                    size="sm"
                    className="w-full font-semibold gap-2 text-sm"
                    onClick={() => setNetflixModalOpen(true)}
                  >
                    <NetflixN />
                    Connect Netflix
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#a3a3a3]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Ready to create rooms
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create room */}
            <Card
              className={`border-[#2a2a2a] overflow-hidden transition-all ${
                user.netflixConnected
                  ? 'bg-[#141414] cursor-pointer hover:border-[#E50914]/40 hover:bg-[#1a1a1a]'
                  : 'bg-[#141414]/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={user.netflixConnected ? onCreateRoom : undefined}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-[#E50914]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Create Room</p>
                  <p className="text-xs text-[#a3a3a3]">
                    {user.netflixConnected ? 'Start a Netflix watch party' : 'Connect Netflix first'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40" />
              </CardContent>
            </Card>

            {/* Join room */}
            <Card className="bg-[#141414] border-[#2a2a2a]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-semibold text-white">Join a Room</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="XXXXXX"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#7c3aed] font-mono text-center tracking-widest uppercase text-base"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  />
                  <Button
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] shrink-0"
                    onClick={handleJoin}
                    disabled={joining || !joinCode}
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
                {displayJoinError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {displayJoinError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: rooms list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Recent Rooms</h2>
              {rooms.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {loadingRooms ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#a3a3a3] animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Film className="w-7 h-7 text-white/30" />
                </div>
                <p className="text-white/60 font-medium mb-1">No rooms yet</p>
                <p className="text-sm text-[#555]">
                  {user.netflixConnected
                    ? 'Create a room to start watching with friends.'
                    : 'Connect Netflix and create your first room.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="bg-[#141414] border-[#2a2a2a] hover:border-[#E50914]/30 transition-all cursor-pointer"
                      onClick={() => onEnterRoom(room)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center shrink-0">
                          <NetflixN />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-white truncate">{room.name}</p>
                            {room.isPrivate ? (
                              <Lock className="w-3 h-3 text-white/30 shrink-0" />
                            ) : (
                              <Globe className="w-3 h-3 text-white/30 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[#E50914]">
                              {room.code}
                            </span>
                            {room.contentTitle && <span className="truncate">{room.contentTitle}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-[#a3a3a3] mb-1">
                            <Users className="w-3 h-3" />
                            <span>{room.participants?.length || 1}/{room.maxParticipants}</span>
                          </div>
                          <Badge
                            variant={room.status === 'watching' ? 'netflix' : 'secondary'}
                            className="text-xs"
                          >
                            {room.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <NetflixConnectModal
        open={netflixModalOpen}
        onOpenChange={setNetflixModalOpen}
        onConnected={(profileName) => {
          onNetflixConnected(profileName);
          setNetflixModalOpen(false);
        }}
      />
    </div>
  );
}
