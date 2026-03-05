import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Crown, RefreshCw
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVideoSync } from '@/hooks/useVideoSync';
import { VideoSyncEvent } from '@/types';
import { formatTime, getYouTubeVideoId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  partyId: string;
  videoUrl: string;
  videoType: 'youtube' | 'direct' | null;
  isHost: boolean;
  isPlaying: boolean;
  currentTime: number;
  currentUserId: string;
  onStateChange: (isPlaying: boolean, currentTime: number) => void;
}

export function VideoPlayer({
  partyId, videoUrl, videoType, isHost, isPlaying: serverIsPlaying,
  currentTime: serverCurrentTime, currentUserId, onStateChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localIsPlaying, setLocalIsPlaying] = useState(serverIsPlaying);
  const [currentTime, setCurrentTime] = useState(serverCurrentTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const isSyncingRef = useRef(false);

  const handleSync = useCallback((event: VideoSyncEvent) => {
    if (!videoRef.current) return;
    isSyncingRef.current = true;

    const timeDiff = Math.abs(videoRef.current.currentTime - event.current_time);

    if (timeDiff > 1.5 || event.type === 'seek') {
      videoRef.current.currentTime = event.current_time;
      setCurrentTime(event.current_time);
    }

    if (event.is_playing && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setLocalIsPlaying(true);
    } else if (!event.is_playing && !videoRef.current.paused) {
      videoRef.current.pause();
      setLocalIsPlaying(false);
    }

    setTimeout(() => { isSyncingRef.current = false; }, 300);
  }, []);

  const { broadcastVideoState, broadcastSeek } = useVideoSync({
    partyId, isHost, currentUserId, onSync: handleSync,
  });

  // Sync with server state for non-host
  useEffect(() => {
    if (!videoRef.current || isHost) return;
    const timeDiff = Math.abs(videoRef.current.currentTime - serverCurrentTime);
    if (timeDiff > 2) videoRef.current.currentTime = serverCurrentTime;
    if (serverIsPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setLocalIsPlaying(true);
    } else if (!serverIsPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
      setLocalIsPlaying(false);
    }
  }, [serverIsPlaying, serverCurrentTime, isHost]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current || !isHost) return;
    const video = videoRef.current;

    if (video.paused) {
      video.play();
      setLocalIsPlaying(true);
      broadcastVideoState(true, video.currentTime);
      onStateChange(true, video.currentTime);
    } else {
      video.pause();
      setLocalIsPlaying(false);
      broadcastVideoState(false, video.currentTime);
      onStateChange(false, video.currentTime);
    }
  }, [isHost, broadcastVideoState, onStateChange]);

  const handleSeek = useCallback((value: number[]) => {
    if (!videoRef.current || !isHost) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
    broadcastSeek(value[0], localIsPlaying);
    onStateChange(localIsPlaying, value[0]);
  }, [isHost, localIsPlaying, broadcastSeek, onStateChange]);

  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current || !isHost) return;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    broadcastSeek(newTime, localIsPlaying);
    onStateChange(localIsPlaying, newTime);
  }, [isHost, duration, localIsPlaying, broadcastSeek, onStateChange]);

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const vol = value[0];
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (localIsPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      timeupdate: () => setCurrentTime(video.currentTime),
      durationchange: () => setDuration(video.duration),
      waiting: () => setIsBuffering(true),
      canplay: () => setIsBuffering(false),
      play: () => setLocalIsPlaying(true),
      pause: () => setLocalIsPlaying(false),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        video.removeEventListener(event, handler);
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-[#0a0f1a] flex items-center justify-center rounded-xl border border-white/5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
            <Play className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No video selected</p>
          {isHost && (
            <p className="text-white/25 text-xs">Add a video URL in party settings</p>
          )}
        </div>
      </div>
    );
  }

  if (videoType === 'youtube') {
    const videoId = getYouTubeVideoId(videoUrl);
    return (
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1&modestbranding=1&rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Watch Party Video"
        />
        {!isHost && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-white/70">Host controls</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video bg-black rounded-xl overflow-hidden relative group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => { if (localIsPlaying) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onClick={handlePlayPause}
        playsInline
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Host indicator */}
      {!isHost && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
          <Crown className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-white/70">Synced to host</span>
        </div>
      )}

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent"
          >
            {/* Center play button */}
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                {localIsPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom controls */}
            <div className="px-4 pb-4 space-y-2">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/70 min-w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1">
                        <Slider
                          value={[currentTime]}
                          min={0}
                          max={duration || 100}
                          step={0.5}
                          onValueChange={handleSeek}
                          className="cursor-pointer"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{formatTime(currentTime)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-xs text-white/70 min-w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                <button onClick={() => handleSkip(-10)} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
                >
                  {localIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button onClick={() => handleSkip(10)} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 ml-2">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <div className="flex-1" />

                <button
                  onClick={() => onStateChange(localIsPlaying, videoRef.current?.currentTime || 0)}
                  className="text-white/50 hover:text-white transition-colors"
                  title="Sync now"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
