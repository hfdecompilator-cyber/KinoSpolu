import { useState, useRef, useEffect } from 'react';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  partyId: string;
  messages: ChatMessage[];
}

export function ChatPanel({ partyId, messages }: ChatPanelProps) {
  const [input, setInput] = useState('');
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
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-white text-sm">Chat</h3>
        <p className="text-xs text-white/40">{messages.length} messages</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isOwn = msg.userId === user?.id;

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <Avatar userId={msg.userId} displayName={msg.displayName} size="sm" />
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-medium text-white/60">{msg.displayName}</span>
                  <span className="text-[10px] text-white/30">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
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

      <form onSubmit={handleSend} className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
