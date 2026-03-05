import { useState, useRef, useEffect } from 'react';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage } from '@/types';

const QUICK_EMOJIS = ['👍', '😂', '🔥', '❤️', '😮', '👏', '💯', '🎉'];

interface ChatPanelProps {
  partyId: string;
  messages: ChatMessage[];
}

export function ChatPanel({ partyId, messages }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const { sendMessage } = usePartyStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(partyId, input.trim());
    setInput('');
    setShowEmoji(false);
  };

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
        <h3 className="font-semibold text-white text-sm">Chat</h3>
        <p className="text-[10px] sm:text-xs text-white/40">{messages.length} messages</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 scrollbar-thin">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] sm:text-xs text-white/40 bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isOwn = msg.userId === user?.id;

          return (
            <div key={msg.id} className={`flex gap-1.5 sm:gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <Avatar userId={msg.userId} displayName={msg.displayName} size="sm" className="w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs shrink-0" />
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : ''}`}>
                <div className={`flex items-baseline gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] sm:text-xs font-medium text-white/60">{msg.displayName}</span>
                  <span className="text-[9px] sm:text-[10px] text-white/30">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm break-words ${
                    isOwn
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-white/10 text-white/90 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2 sm:p-3 border-t border-white/10">
        {showEmoji && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-base sm:text-lg transition-transform active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="shrink-0 p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            😊
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 px-3 sm:px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 active:scale-95"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
