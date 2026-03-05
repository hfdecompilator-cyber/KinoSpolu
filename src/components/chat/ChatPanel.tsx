import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { getInitials, timeAgo } from '@/lib/utils';
import { Send, Smile, AtSign, Image as ImageIcon } from 'lucide-react';
import type { ChatMessage } from '@/types';

const EMOJIS = ['😂', '❤️', '🔥', '👏', '😍', '💀', '😭', '🎉', '👀', '💯', '🤣', '😮'];

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, currentParty, subscribeToChat } = usePartyStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (currentParty) {
      const unsub = subscribeToChat(currentParty.id);
      return unsub;
    }
  }, [currentParty?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    sendMessage(message.trim(), user.id, user.username, user.avatar_url);
    setMessage('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const addEmoji = (emoji: string) => {
    setMessage((m) => m + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Live Chat</h3>
          <p className="text-xs text-gray-500">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} isOwn={msg.user_id === user?.id} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2"
          >
            <div className="glass-light rounded-xl p-2 flex flex-wrap gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2 rounded-lg transition-colors ${
              showEmoji ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-secondary/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChatMessageItem({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-1"
      >
        <span className="text-xs text-gray-500 bg-secondary/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {!isOwn && (
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarImage src={message.avatar_url} />
          <AvatarFallback className="text-xs">{getInitials(message.username)}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-primary-light font-medium mb-0.5 block">{message.username}</span>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isOwn
              ? 'gradient-primary text-white rounded-br-md'
              : 'bg-secondary/70 text-gray-200 rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-gray-600 mt-0.5 block">
          {timeAgo(message.created_at)}
        </span>
      </div>
    </motion.div>
  );
}
