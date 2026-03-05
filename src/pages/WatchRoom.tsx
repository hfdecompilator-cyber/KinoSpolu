import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { VoiceChat } from '@/components/voice/VoiceChat';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { formatTime, getInitials } from '@/lib/utils';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, MessageCircle, Headphones, Users, ArrowLeft,
  Settings, Copy, Share2, Radio, ChevronRight, ChevronLeft,
  MonitorPlay
} from 'lucide-react';
import { toast } from 'sonner';

export default function WatchRoom() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { parties, currentParty, joinParty, leaveParty, voiceMembers, isInVoice } = usePartyStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(7200);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const progressRef = useRef<HTMLDivElement>(null);

  const party = currentParty || parties.find((p) => p.id === partyId);

  useEffect(() => {
    if (party && user && !currentParty) {
      joinParty(party.code, user.id, user.username);
    }
    return () => {
      // Don't leave party on unmount to preserve state
    };
  }, [party?.id, user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((t) => (t >= duration ? 0 : t + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <MonitorPlay className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Join the Watch Party</h1>
          <p className="text-gray-400 mb-8">Sign in to join this party</p>
          <Button onClick={() => setAuthOpen(true)} size="lg">Sign In to Join</Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  if (!party) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Party Not Found</h1>
        <p className="text-gray-400 mb-6">This party doesn't exist or has ended.</p>
        <Button onClick={() => navigate('/discover')}>Browse Parties</Button>
      </div>
    );
  }

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(pos * duration));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(party.code);
    toast.success('Party code copied!');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 glass border-b border-white/5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white text-sm">{party.name}</h2>
                <Badge variant="live" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              </div>
              <p className="text-xs text-gray-500">
                {party.media_title || 'No media'} · {party.current_members} watching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyCode} className="gap-1.5 text-xs">
              <Copy className="w-3 h-3" />
              {party.code}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {party.thumbnail ? (
              <img
                src={party.thumbnail}
                alt={party.name}
                className="w-full h-full object-cover opacity-30 blur-sm"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-pink-500/10" />
            )}
          </div>

          <div className="relative z-10 text-center">
            {party.media_url ? (
              <video
                className="max-h-full max-w-full"
                src={party.media_url}
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
                  <MonitorPlay className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {party.media_title || party.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Hosted by {party.host_name}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(party.current_members, 5))].map((_, i) => (
                      <Avatar key={i} className="w-8 h-8 border-2 border-black">
                        <AvatarFallback className="text-[10px]">
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {party.current_members} watching
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Floating reactions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge variant="live" className="gap-1">
              <Radio className="w-3 h-3" />
              LIVE
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {party.current_members}
            </Badge>
          </div>
        </div>

        {/* Player Controls */}
        <div className="glass border-t border-white/5 px-4 py-3">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="w-full h-1.5 bg-secondary rounded-full mb-3 cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full gradient-primary rounded-full relative transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <SkipForward className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                className="w-20 h-1 accent-primary"
              />
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 360 : 0 }}
        className="hidden md:block overflow-hidden border-l border-white/5 bg-background"
      >
        <div className="w-[360px] h-full flex flex-col">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex flex-col h-full">
            <div className="px-2 pt-2">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="chat" className="gap-1.5 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-1.5 text-xs">
                  <Headphones className="w-3.5 h-3.5" />
                  Voice
                  {isInVoice && (
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Members
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
              <ChatPanel />
            </TabsContent>

            <TabsContent value="voice" className="flex-1 overflow-hidden m-0">
              <VoiceChat />
            </TabsContent>

            <TabsContent value="members" className="flex-1 overflow-y-auto m-0 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    {party.current_members} Members
                  </span>
                </div>

                {/* Host */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback>{getInitials(party.host_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{party.host_name}</span>
                    <Badge variant="default" className="ml-2 text-[10px]">Host</Badge>
                  </div>
                </div>

                {/* Sample members */}
                {['MovieFan', 'ChillVibes', 'NightOwl', 'StreamKing'].slice(0, Math.max(0, party.current_members - 1)).map((name) => (
                  <div key={name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300">{name}</span>
                  </div>
                ))}

                {user && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{user.username}</span>
                      <span className="text-xs text-gray-500 ml-1">(you)</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex" style={{ top: '4rem' }}>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
          <div className="w-[320px] glass border-l border-white/5 flex flex-col">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex flex-col h-full">
              <div className="px-2 pt-2">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="chat" className="gap-1 text-xs">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-1 text-xs">
                    <Headphones className="w-3.5 h-3.5" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="members" className="gap-1 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    People
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
                <ChatPanel />
              </TabsContent>
              <TabsContent value="voice" className="flex-1 overflow-hidden m-0">
                <VoiceChat />
              </TabsContent>
              <TabsContent value="members" className="flex-1 overflow-y-auto m-0 p-4">
                <p className="text-gray-400 text-sm">{party.current_members} members in party</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
