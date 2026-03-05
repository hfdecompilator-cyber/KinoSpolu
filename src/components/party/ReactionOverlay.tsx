import { useState, useEffect, useCallback, useRef } from 'react';

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
  startTime: number;
}

const REACTION_EMOJIS = ['🔥', '😂', '😮', '❤️', '👏', '💯', '😭', '🎉'];

const QUICK_REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'LOL' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '💯', label: '100' },
  { emoji: '😭', label: 'Cry' },
  { emoji: '🎉', label: 'Party' },
];

interface ReactionOverlayProps {
  onReact?: (emoji: string) => void;
}

export function ReactionOverlay({ onReact }: ReactionOverlayProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showBar, setShowBar] = useState(false);
  const idRef = useRef(0);

  const addReaction = useCallback((emoji: string) => {
    const id = idRef.current++;
    const x = 10 + Math.random() * 80;
    setReactions((prev) => [...prev.slice(-20), { id, emoji, x, startTime: Date.now() }]);
    onReact?.(emoji);
  }, [onReact]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReactions((prev) => prev.filter((r) => Date.now() - r.startTime < 3000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const emoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
        addReaction(emoji);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [addReaction]);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {reactions.map((r) => {
          const elapsed = Date.now() - r.startTime;
          const progress = Math.min(elapsed / 3000, 1);
          const opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
          const y = 100 - progress * 120;

          return (
            <div
              key={r.id}
              className="absolute text-2xl sm:text-3xl transition-none"
              style={{
                left: `${r.x}%`,
                bottom: `${y}%`,
                opacity,
                transform: `scale(${1 + Math.sin(progress * Math.PI) * 0.3})`,
                filter: `drop-shadow(0 0 8px rgba(0,0,0,0.5))`,
              }}
            >
              {r.emoji}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-14 sm:bottom-16 right-2 sm:right-4 z-20">
        <button
          onClick={() => setShowBar(!showBar)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
        >
          😊
        </button>

        {showBar && (
          <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-1.5 p-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            {QUICK_REACTIONS.map((r) => (
              <button
                key={r.emoji}
                onClick={() => { addReaction(r.emoji); }}
                className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-all hover:scale-125 active:scale-90"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
