import { useState, useRef, useEffect, useCallback } from 'react';

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
}

const DEMO_SUBTITLES: SubtitleTrack[] = [
  { id: 'off', label: 'Off', language: '', src: '' },
  { id: 'en', label: 'English', language: 'en', src: '' },
  { id: 'es', label: 'Español', language: 'es', src: '' },
  { id: 'fr', label: 'Français', language: 'fr', src: '' },
  { id: 'de', label: 'Deutsch', language: 'de', src: '' },
  { id: 'ja', label: '日本語', language: 'ja', src: '' },
  { id: 'ko', label: '한국어', language: 'ko', src: '' },
  { id: 'pt', label: 'Português', language: 'pt', src: '' },
];

const DEMO_SUBTITLE_LINES: Record<string, string[]> = {
  en: [
    "Welcome to the watch party!",
    "Everyone's synced and ready to go.",
    "Grab your snacks, the show is starting...",
    "This is going to be epic!",
    "Did you see that scene?!",
    "No spoilers in chat please!",
    "Best episode yet honestly.",
  ],
  es: [
    "¡Bienvenidos a la fiesta!",
    "Todos están sincronizados y listos.",
    "Agarren sus bocadillos, empieza el show...",
    "¡Esto va a ser épico!",
    "¿¡Vieron esa escena?!",
    "¡Sin spoilers en el chat, por favor!",
    "El mejor episodio hasta ahora.",
  ],
  fr: [
    "Bienvenue à la soirée !",
    "Tout le monde est synchronisé et prêt.",
    "Prenez vos snacks, le spectacle commence...",
    "Ça va être épique !",
    "Vous avez vu cette scène ?!",
    "Pas de spoilers dans le chat svp !",
    "Le meilleur épisode jusqu'ici.",
  ],
};

interface VideoPlayerProps {
  thumbnailUrl: string;
  contentTitle: string;
  serviceName: string;
  serviceIcon: string;
  isPlaying: boolean;
  children?: React.ReactNode;
}

export function VideoPlayer({
  thumbnailUrl,
  contentTitle,
  serviceName,
  serviceIcon,
  isPlaying,
  children,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPiP, setIsPiP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off');
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const subtitleTimer = useRef<ReturnType<typeof setTimeout>>();

  const pipSupported = 'pictureInPictureEnabled' in document;

  useEffect(() => {
    if (activeSubtitle !== 'off' && isPlaying) {
      const lines = DEMO_SUBTITLE_LINES[activeSubtitle] || DEMO_SUBTITLE_LINES['en'] || [];
      let idx = 0;
      const cycle = () => {
        setCurrentSubtitleText(lines[idx % lines.length]);
        idx++;
        subtitleTimer.current = setTimeout(cycle, 3000 + Math.random() * 2000);
      };
      cycle();
      return () => { if (subtitleTimer.current) clearTimeout(subtitleTimer.current); };
    } else {
      setCurrentSubtitleText('');
    }
  }, [activeSubtitle, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.05));
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (isPiP) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      const el = containerRef.current;
      if (!el) return;
      if (isPiP) {
        el.classList.remove('pip-mode');
        setIsPiP(false);
      } else {
        el.classList.add('pip-mode');
        setIsPiP(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch { /* fullscreen not supported */ }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
        playsInline
        muted
      />

      <img
        src={thumbnailUrl}
        alt={contentTitle}
        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {children}

      {activeSubtitle !== 'off' && currentSubtitleText && (
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-[90%]">
          <div className="px-4 py-2 bg-black/80 rounded-lg backdrop-blur-sm">
            <p className="text-white text-sm sm:text-base text-center font-medium">
              {currentSubtitleText}
            </p>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="px-3 sm:px-4 pb-1">
          <div className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group/progress">
            <div
              className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white hidden sm:block">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
              </svg>
            </button>

            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-purple-500 hidden sm:block"
              />
            </div>

            <span className="text-xs text-white/60 ml-1 hidden sm:inline">
              {Math.floor(progress * 1.2)}:{ String(Math.floor((progress * 72) % 60)).padStart(2, '0')} / 2:00:00
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="relative">
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  activeSubtitle !== 'off'
                    ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/40'
                    : 'hover:bg-white/10 text-white'
                }`}
                title="Subtitles"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path strokeLinecap="round" d="M6 12h4M14 12h4M8 16h8" />
                </svg>
              </button>

              {showSubtitles && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSubtitles(false)} />
                  <div className="absolute bottom-full right-0 mb-2 w-44 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Subtitles</p>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {DEMO_SUBTITLES.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => { setActiveSubtitle(sub.id); setShowSubtitles(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                            activeSubtitle === sub.id
                              ? 'text-purple-300 bg-purple-600/10'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {activeSubtitle === sub.id && (
                            <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <span className={activeSubtitle !== sub.id ? 'ml-6' : ''}>
                            {sub.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {pipSupported && (
              <button
                onClick={togglePiP}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isPiP ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-white/10 text-white'
                }`}
                title="Picture in Picture"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" opacity="0.3" />
                  <rect x="11" y="9" width="9" height="7" rx="1" />
                </svg>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
