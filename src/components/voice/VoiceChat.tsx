import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Phone, Volume2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  partyId: string;
  currentUserId: string;
  currentUsername: string;
  currentAvatarUrl?: string | null;
}

function WaveIndicator() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[1, 2, 3, 4, 3].map((h, i) => (
        <div
          key={i}
          className="wave-bar w-0.5 bg-violet-400 rounded-full"
          style={{ height: `${h * 3}px` }}
        />
      ))}
    </div>
  );
}

export function VoiceChat({ partyId, currentUserId, currentUsername, currentAvatarUrl }: VoiceChatProps) {
  const {
    isJoined,
    isMuted,
    participants,
    error,
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
  } = useVoiceChat(partyId, currentUserId, currentUsername);

  return (
    <div className="bg-[#0f1520] border-t border-white/5">
      {/* Voice Chat Header */}
      <div className="px-4 py-3 flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-white/40" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Voice Chat</span>
        {isJoined && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Connected</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Participants list */}
      {isJoined && (
        <div className="px-3 pb-2 space-y-1">
          {/* Current user */}
          <div className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all',
            !isMuted && 'bg-violet-600/10'
          )}>
            <div className="relative">
              <Avatar className={cn('w-7 h-7', !isMuted && 'animate-speaking ring-2 ring-violet-500/50')}>
                <AvatarImage src={currentAvatarUrl || undefined} />
                <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">
                  {getInitials(currentUsername)}
                </AvatarFallback>
              </Avatar>
              {isMuted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                  <MicOff className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs text-white/80 flex-1">You</span>
            {!isMuted && <WaveIndicator />}
          </div>

          {/* Other participants */}
          <AnimatePresence>
            {participants.map(participant => (
              <motion.div
                key={participant.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all',
                  participant.is_speaking && !participant.is_muted && 'bg-violet-600/10'
                )}
              >
                <div className="relative">
                  <Avatar className={cn(
                    'w-7 h-7',
                    participant.is_speaking && !participant.is_muted && 'animate-speaking ring-2 ring-violet-500/50'
                  )}>
                    <AvatarImage src={participant.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                      {getInitials(participant.username)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.is_muted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                      <MicOff className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-white/80 flex-1 truncate">{participant.username}</span>
                {participant.is_speaking && !participant.is_muted && <WaveIndicator />}
              </motion.div>
            ))}
          </AnimatePresence>

          {participants.length === 0 && (
            <p className="text-xs text-white/25 text-center py-2">
              No one else in voice chat
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="px-3 pb-3 flex gap-2">
        {isJoined ? (
          <>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className={cn(
                'flex-1 h-8 gap-1.5 text-xs border-white/10',
                isMuted
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              onClick={leaveVoiceChat}
              variant="outline"
              size="sm"
              className="h-8 px-3 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            >
              <PhoneOff className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button
            onClick={joinVoiceChat}
            size="sm"
            className="w-full h-8 bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600/30 gap-1.5 text-xs"
            variant="outline"
          >
            <Phone className="w-3 h-3" />
            Join Voice Chat
          </Button>
        )}
      </div>
    </div>
  );
}
