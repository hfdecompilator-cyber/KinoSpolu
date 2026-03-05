import { useState } from 'react';

export interface MoodTheme {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  accent: string;
  glow: string;
  description: string;
}

export const MOOD_THEMES: MoodTheme[] = [
  {
    id: 'default',
    name: 'Classic',
    icon: '🎬',
    gradient: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'purple-500',
    glow: '',
    description: 'Standard dark theme',
  },
  {
    id: 'cinema',
    name: 'Cinema',
    icon: '🍿',
    gradient: 'from-zinc-950 via-neutral-900 to-zinc-950',
    accent: 'amber-500',
    glow: 'shadow-[0_0_100px_rgba(245,158,11,0.08)]',
    description: 'Warm theater vibes',
  },
  {
    id: 'cozy',
    name: 'Cozy Night',
    icon: '🕯️',
    gradient: 'from-orange-950/40 via-amber-950/30 to-stone-900',
    accent: 'orange-400',
    glow: 'shadow-[0_0_150px_rgba(251,146,60,0.1)]',
    description: 'Warm candlelit ambience',
  },
  {
    id: 'horror',
    name: 'Horror',
    icon: '👻',
    gradient: 'from-red-950/50 via-slate-950 to-red-950/30',
    accent: 'red-500',
    glow: 'shadow-[0_0_100px_rgba(239,68,68,0.1)]',
    description: 'Spooky atmosphere',
  },
  {
    id: 'party',
    name: 'Party',
    icon: '🎉',
    gradient: 'from-purple-950/50 via-fuchsia-950/30 to-blue-950/40',
    accent: 'pink-500',
    glow: 'shadow-[0_0_120px_rgba(236,72,153,0.1)]',
    description: 'Vibrant party mode',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    gradient: 'from-cyan-950/50 via-slate-900 to-blue-950/50',
    accent: 'cyan-400',
    glow: 'shadow-[0_0_120px_rgba(34,211,238,0.08)]',
    description: 'Calm & serene',
  },
];

interface MoodSelectorProps {
  currentMood: string;
  onMoodChange: (mood: string) => void;
}

export function MoodSelector({ currentMood, onMoodChange }: MoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = MOOD_THEMES.find((m) => m.id === currentMood) || MOOD_THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 hover:text-white transition-all"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Party Mood</p>
            </div>
            <div className="py-1">
              {MOOD_THEMES.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => { onMoodChange(mood.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    currentMood === mood.id
                      ? 'bg-purple-600/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{mood.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{mood.name}</p>
                    <p className="text-[10px] text-white/40">{mood.description}</p>
                  </div>
                  {currentMood === mood.id && (
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
