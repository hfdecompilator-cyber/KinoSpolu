import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { PartyMember } from '@/types';

interface ViewerSyncBarProps {
  members: PartyMember[];
  isPlaying: boolean;
}

interface MemberSync {
  userId: string;
  displayName: string;
  progress: number;
  status: 'synced' | 'buffering' | 'behind';
}

export function ViewerSyncBar({ members, isPlaying }: ViewerSyncBarProps) {
  const [syncs, setSyncs] = useState<MemberSync[]>([]);

  useEffect(() => {
    const init = members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      progress: 50 + Math.random() * 5,
      status: 'synced' as const,
    }));
    setSyncs(init);

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSyncs((prev) =>
        prev.map((s) => {
          const drift = (Math.random() - 0.5) * 2;
          const newProgress = Math.min(100, Math.max(0, s.progress + 0.05 + drift * 0.01));
          const avgProgress = prev.reduce((a, b) => a + b.progress, 0) / prev.length;
          const diff = Math.abs(newProgress - avgProgress);
          return {
            ...s,
            progress: newProgress,
            status: diff > 3 ? 'behind' : diff > 1 ? 'buffering' : 'synced',
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [members, isPlaying]);

  const allSynced = syncs.every((s) => s.status === 'synced');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${allSynced ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
      <span className="text-[11px] text-white/50">
        {allSynced ? 'All synced' : 'Syncing...'}
      </span>
      <div className="flex -space-x-1.5">
        {syncs.slice(0, 5).map((s) => (
          <div
            key={s.userId}
            className={`w-5 h-5 rounded-full ring-2 ${
              s.status === 'synced' ? 'ring-green-500/50' : s.status === 'buffering' ? 'ring-yellow-500/50' : 'ring-red-500/50'
            }`}
            title={`${s.displayName}: ${s.status}`}
          >
            <Avatar userId={s.userId} displayName={s.displayName} size="sm" className="w-5 h-5 text-[8px]" />
          </div>
        ))}
        {syncs.length > 5 && (
          <div className="w-5 h-5 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-[8px] text-white/60">
            +{syncs.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
