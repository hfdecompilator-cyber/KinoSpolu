import { motion } from 'framer-motion';
import { Users, Play, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Party } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PartyCardProps {
  party: Party;
  currentUserId: string;
  index?: number;
}

const PARTY_COLORS = [
  'from-violet-600/30 to-purple-700/20',
  'from-blue-600/30 to-cyan-700/20',
  'from-pink-600/30 to-rose-700/20',
  'from-orange-600/30 to-amber-700/20',
  'from-green-600/30 to-emerald-700/20',
];

export function PartyCard({ party, currentUserId, index = 0 }: PartyCardProps) {
  const navigate = useNavigate();
  const isHost = party.host_id === currentUserId;
  const colorClass = PARTY_COLORS[index % PARTY_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="cursor-pointer group"
      onClick={() => navigate(`/watch/${party.id}`)}
    >
      <div className="relative bg-[#161b27] border border-white/8 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all">
        {/* Background gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', colorClass)} />

        {/* Content */}
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isHost && (
                  <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                )}
                <h3 className="font-semibold text-white truncate">{party.name}</h3>
              </div>
              <p className="text-xs text-white/40">
                Hosted by {isHost ? 'you' : (party.host?.username || 'Unknown')}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
              {party.is_playing && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-white/40">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs">{party.member_count || 0} watching</span>
              </div>
              {party.video_url && (
                <div className="flex items-center gap-1.5 text-white/40">
                  <Play className="w-3 h-3" />
                  <span className="text-xs truncate max-w-32">
                    {party.video_type === 'youtube' ? 'YouTube' : 'Video'}
                  </span>
                </div>
              )}
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-violet-600/30 flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Code badge */}
        <div className="absolute top-4 right-4">
          <span className="text-xs font-mono text-white/20">{party.party_code}</span>
        </div>
      </div>
    </motion.div>
  );
}
