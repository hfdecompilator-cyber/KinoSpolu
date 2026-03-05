import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { formatTime } from '@/lib/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Hls from 'hls.js';

interface Party {
  id: string;
  code: string;
  name: string;
  video_url: string | null;
  video_title: string | null;
  playback_position: number;
  is_playing: boolean;
}

interface WatchPageProps {
  party: Party | null;
  onLeave: () => void;
}

// Default HLS test stream
const DEFAULT_VIDEO = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export function WatchPage({ party, onLeave }: WatchPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { user, displayName } = useAuth();
  const { messages, sendMessage } = useRealtimeChat(
    party?.id ?? null,
    user?.id ?? '',
    displayName
  );
  const { voiceState, joinVoice, leaveVoice } = useVoiceChat(party?.id ?? null, user?.id ?? '');

  const videoUrl = party?.video_url || DEFAULT_VIDEO;

  // Init video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !party) return;

    const initHls = () => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.currentTime = party.playback_position;
          setCurrentTime(party.playback_position);
          if (party.is_playing) video.play();
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.currentTime = party.playback_position;
        setCurrentTime(party.playback_position);
        if (party.is_playing) video.play();
      }
    };

    if (videoUrl.endsWith('.m3u8')) {
      initHls();
    } else {
      video.src = videoUrl;
      video.currentTime = party.playback_position;
      setCurrentTime(party.playback_position);
      if (party.is_playing) video.play();
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [party?.id, videoUrl]);

  // Sync state from video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const val = parseFloat(e.target.value);
    if (video) {
      video.currentTime = val;
      setCurrentTime(val);
    }
  };

  const shareCode = () => {
    if (party?.code) {
      navigator.clipboard.writeText(party.code);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No party selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold truncate">{party.name}</h1>
          <span className="text-sm text-gray-500 font-mono">{party.code}</span>
          <Button variant="ghost" size="sm" onClick={shareCode}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={voiceState === 'connected' ? 'default' : 'outline'}
            size="sm"
            onClick={voiceState === 'connected' ? leaveVoice : joinVoice}
          >
            {voiceState === 'connected' ? (
              <MicOff className="h-4 w-4 mr-1" />
            ) : (
              <Mic className="h-4 w-4 mr-1" />
            )}
            Voice
          </Button>
          <Button variant="outline" size="sm" onClick={onLeave}>
            Leave
          </Button>
        </div>
      </div>

      {/* Main: Video + Chat */}
      <div className="flex flex-1 min-h-0">
        {/* Video area */}
        <div
          className="flex-1 flex flex-col min-w-0 relative group"
          onClick={togglePlay}
        >
          <div className="relative flex-1 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              playsInline
              muted={muted}
            />
            {/* Play overlay */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 mb-2 accent-primary"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <span className="text-sm text-gray-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div
          className={`${
            showChat ? 'w-80 md:w-96' : 'w-0'
          } flex flex-col border-l border-border/50 bg-surface/50 backdrop-blur transition-all overflow-hidden`}
        >
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <h3 className="font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Live Chat
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(!showChat)}>
              {showChat ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-center">
                <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Say hi to everyone watching!</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="group flex flex-col p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary">{m.user_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm break-words mt-0.5">{m.content}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-border/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Chat toggle when collapsed */}
      {!showChat && (
        <Button
          className="fixed right-4 bottom-4 rounded-full w-14 h-14"
          onClick={() => setShowChat(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
