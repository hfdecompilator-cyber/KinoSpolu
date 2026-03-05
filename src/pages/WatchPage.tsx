import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, Settings, Link, Copy, Check,
  Crown, X, Edit3, MessageCircle, Volume2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { VoiceChat } from '@/components/voice/VoiceChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParty } from '@/hooks/useParty';
import { useAuth } from '@/hooks/useAuth';
import { getInitials, cn } from '@/lib/utils';

export function WatchPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { party, members, loading, updateVideoState, updateVideoUrl, leaveParty } = useParty(partyId);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [copied, setCopied] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const isHost = party?.host_id === user?.id;

  const handleVideoStateChange = useCallback(async (isPlaying: boolean, currentTime: number) => {
    if (!partyId || !isHost) return;
    await updateVideoState(partyId, isPlaying, currentTime);
  }, [partyId, isHost, updateVideoState]);

  const handleCopyCode = () => {
    if (!party?.party_code) return;
    navigator.clipboard.writeText(party.party_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!partyId || !user?.id) return;
    await leaveParty(partyId, user.id, isHost);
    navigate('/home');
  };

  const handleUpdateUrl = async () => {
    if (!partyId || !newVideoUrl.trim()) return;
    await updateVideoUrl(partyId, newVideoUrl.trim());
    setEditingUrl(false);
    setNewVideoUrl('');
  };

  useEffect(() => {
    if (party) {
      setNewVideoUrl(party.video_url || '');
    }
  }, [party]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-white/40 text-sm">Loading party...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60">Party not found or no longer active.</p>
          <Button onClick={() => navigate('/home')} className="bg-violet-600 hover:bg-violet-700">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5 px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm hidden sm:block">Home</span>
        </button>

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isHost && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
            <h1 className="font-semibold text-white text-sm truncate">{party.name}</h1>
            {party.is_playing && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Party code */}
          <button
            onClick={handleCopyCode}
            className="hidden sm:flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
          >
            <span className="text-xs font-mono text-white/60">{party.party_code}</span>
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
          </button>

          {/* Members count */}
          <div className="flex items-center gap-1.5 text-white/40">
            <Users className="w-4 h-4" />
            <span className="text-xs">{members.length}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:block ml-1">Leave</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Video + controls area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-3 overflow-auto">
          {/* Video */}
          <VideoPlayer
            partyId={party.id}
            videoUrl={party.video_url || ''}
            videoType={party.video_type}
            isHost={isHost}
            isPlaying={party.is_playing}
            currentTime={party.current_time}
            currentUserId={user?.id || ''}
            onStateChange={handleVideoStateChange}
          />

          {/* Video URL editor (host only) */}
          {isHost && (
            <div className="bg-white/3 border border-white/8 rounded-xl p-3">
              {editingUrl ? (
                <div className="flex gap-2">
                  <Input
                    value={newVideoUrl}
                    onChange={e => setNewVideoUrl(e.target.value)}
                    placeholder="YouTube URL or direct video link"
                    className="flex-1 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-violet-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdateUrl();
                      if (e.key === 'Escape') { setEditingUrl(false); setNewVideoUrl(party.video_url || ''); }
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 h-9" onClick={handleUpdateUrl}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 text-white/40" onClick={() => { setEditingUrl(false); setNewVideoUrl(party.video_url || ''); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/30 flex-1 truncate">
                    {party.video_url || 'No video URL set'}
                  </span>
                  <button
                    onClick={() => setEditingUrl(true)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    {party.video_url ? 'Change' : 'Add video'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Members list (mobile/expanded) */}
          <div className="lg:hidden">
            <div className="bg-white/3 border border-white/8 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Watching</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-1.5">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-violet-600/30 text-white">
                        {getInitials(member.profile?.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-white/50">
                      {member.profile?.username || 'Unknown'}
                      {member.user_id === party.host_id && (
                        <Crown className="w-2.5 h-2.5 text-amber-400 inline ml-1" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className={cn(
          'flex-shrink-0 flex flex-col border-l border-white/5 transition-all duration-300',
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
        )}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 z-10 w-5 bg-[#161b27] border border-white/10 border-l-0 rounded-r-lg py-3 flex items-center justify-center text-white/30 hover:text-white transition-colors"
            style={{ right: sidebarOpen ? '320px' : '0' }}
          >
            {sidebarOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Sidebar tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="flex-shrink-0 bg-[#0a0f1a] border-b border-white/5">
              <TabsList className="w-full bg-transparent p-1 h-auto rounded-none">
                <TabsTrigger
                  value="chat"
                  className="flex-1 h-9 text-xs data-[state=active]:bg-white/5 data-[state=active]:text-white text-white/40 gap-1.5 rounded-lg"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="flex-1 h-9 text-xs data-[state=active]:bg-white/5 data-[state=active]:text-white text-white/40 gap-1.5 rounded-lg"
                >
                  <Users className="w-3.5 h-3.5" />
                  Members ({members.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
              <ChatPanel
                partyId={party.id}
                currentUserId={user?.id || ''}
                currentUsername={profile?.username || user?.email || 'Anonymous'}
              />
            </TabsContent>

            <TabsContent value="members" className="flex-1 overflow-auto m-0 p-3">
              <div className="space-y-2">
                {members.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/2 hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-violet-600/30 text-white text-xs font-bold">
                        {getInitials(member.profile?.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white/80 truncate">
                          {member.profile?.username || 'Unknown'}
                        </span>
                        {member.user_id === user?.id && (
                          <span className="text-xs text-violet-400">(you)</span>
                        )}
                      </div>
                      {member.user_id === party.host_id && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span className="text-xs text-amber-400">Host</span>
                        </div>
                      )}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Online" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Voice chat - always visible at bottom */}
            {user && (
              <VoiceChat
                partyId={party.id}
                currentUserId={user.id}
                currentUsername={profile?.username || user.email || 'Anonymous'}
                currentAvatarUrl={profile?.avatar_url}
              />
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
