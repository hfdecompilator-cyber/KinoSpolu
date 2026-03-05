import { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/hooks/useChat';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['😂', '❤️', '🔥', '👏', '😮', '💀', '🎉', '👍'];
const EMOJI_SUGGESTIONS = ['😂', '❤️', '🔥', '👏', '😮', '💀', '🎉', '👍', '😭', '🥹', '✨', '💯', '🙌', '🤣', '😍', '🤔'];

interface ChatPanelProps {
  partyId: string;
  currentUserId: string;
  currentUsername: string;
}

export function ChatPanel({ partyId, currentUserId, currentUsername }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const { messages, loading, sendMessage, addReaction, bottomRef } = useChat(partyId, currentUserId);

  const handleSend = async () => {
    if (!message.trim()) return;
    const msg = message;
    setMessage('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1520]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h3 className="text-sm font-semibold text-white">Live Chat</h3>
        <span className="text-xs text-white/30 ml-auto">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              <p>No messages yet</p>
              <p className="text-xs mt-1">Be the first to say something!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isOwn = msg.user_id === currentUserId;
                const prevMsg = messages[i - 1];
                const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id;
                const username = msg.profile?.username || 'Unknown';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-2 px-1 py-0.5 rounded-lg group hover:bg-white/3 transition-colors',
                      showAvatar && 'mt-3'
                    )}
                  >
                    <div className="w-7 flex-shrink-0">
                      {showAvatar && (
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback
                            className={cn(
                              'text-xs font-bold',
                              isOwn ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/70'
                            )}
                          >
                            {getInitials(username)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={cn(
                            'text-xs font-semibold',
                            isOwn ? 'text-violet-400' : 'text-white/70'
                          )}>
                            {isOwn ? 'You' : username}
                          </span>
                          <span className="text-xs text-white/20">
                            {formatRelativeTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-white/85 leading-relaxed break-words">
                        {msg.message}
                      </p>
                      {msg.reaction && (
                        <span className="text-base">{msg.reaction}</span>
                      )}
                    </div>

                    {/* Reaction button */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-start gap-1 transition-opacity">
                      {QUICK_REACTIONS.slice(0, 3).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="text-xs hover:scale-125 transition-transform p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t border-white/5">
        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-2 p-2 bg-[#1a2235] border border-white/10 rounded-xl"
            >
              <div className="flex flex-wrap gap-1">
                {EMOJI_SUGGESTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-xl p-1 hover:bg-white/10 rounded-lg transition-colors hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Send a message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-10 max-h-32 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm pr-2 focus:border-violet-500 rounded-xl py-2.5"
            />
          </div>
          <div className="flex gap-1.5 pb-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                'w-9 h-9 rounded-xl transition-colors',
                showEmoji ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-white/5 text-white/40'
              )}
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
