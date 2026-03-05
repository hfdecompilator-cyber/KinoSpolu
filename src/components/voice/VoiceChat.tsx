import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import {
  Mic, MicOff, Headphones, PhoneOff,
  Phone, Volume2, Signal, VolumeX
} from 'lucide-react';

export function VoiceChat() {
  const {
    voiceMembers, isInVoice, isMuted, isDeafened,
    joinVoice, leaveVoice, toggleMute, toggleDeafen,
  } = usePartyStore();
  const { user } = useAuthStore();

  if (!isInVoice) {
    return (
      <div className="p-4">
        <div className="glass rounded-xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Voice Chat</h3>
          <p className="text-xs text-gray-500 mb-4">Talk with everyone in the party</p>
          <Button
            onClick={() => user && joinVoice(user.id, user.username)}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Phone className="w-4 h-4" />
            Join Voice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="font-semibold text-white text-sm">Voice Connected</h3>
            <p className="text-xs text-emerald-400">{voiceMembers.length} in voice</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        <AnimatePresence>
          {voiceMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                member.isSpeaking ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Avatar className={`w-9 h-9 ${member.isSpeaking ? 'ring-2 ring-emerald-400' : ''}`}>
                  <AvatarFallback>{getInitials(member.username)}</AvatarFallback>
                </Avatar>
                {member.isSpeaking && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white truncate block">
                  {member.username}
                  {member.id === user?.id && (
                    <span className="text-xs text-gray-500 ml-1">(you)</span>
                  )}
                </span>
                {member.isSpeaking && (
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full"
                        animate={{
                          height: [4, 12, 6, 14, 4],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              {member.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
              {member.isDeafened && <VolumeX className="w-3.5 h-3.5 text-red-400" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            onClick={toggleMute}
            className="rounded-full w-11 h-11"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            variant={isDeafened ? 'destructive' : 'secondary'}
            size="icon"
            onClick={toggleDeafen}
            className="rounded-full w-11 h-11"
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={leaveVoice}
            className="rounded-full w-11 h-11"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
