import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { getInitials, timeAgo } from '@/lib/utils';
import {
  MessageCircle, Search, Send, ArrowLeft, MoreHorizontal,
  Phone, Video, Smile, Image as ImageIcon
} from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'MovieBuff', lastMessage: 'That movie was insane! 🔥', time: '2m ago', unread: 3, online: true },
  { id: '2', name: 'ChillVibes', lastMessage: 'Starting a lo-fi party at 8pm', time: '15m ago', unread: 1, online: true },
  { id: '3', name: 'OtakuKing', lastMessage: 'Did you see the new episode?', time: '1h ago', unread: 0, online: false },
  { id: '4', name: 'ScaryMary', lastMessage: 'Horror marathon this weekend?', time: '3h ago', unread: 0, online: true },
  { id: '5', name: 'DramaFan', lastMessage: 'OMG the plot twist 😱', time: '1d ago', unread: 0, online: false },
];

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
}

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', sender: 'MovieBuff', content: 'Hey! Did you watch Interstellar last night?', time: '10:30 AM', isOwn: false },
    { id: 'm2', sender: 'You', content: 'Yes! The docking scene was incredible', time: '10:32 AM', isOwn: true },
    { id: 'm3', sender: 'MovieBuff', content: 'Right?! The music made it even better', time: '10:33 AM', isOwn: false },
    { id: 'm4', sender: 'You', content: 'Hans Zimmer is a genius', time: '10:35 AM', isOwn: true },
    { id: 'm5', sender: 'MovieBuff', content: 'Wanna watch Tenet together tonight?', time: '10:36 AM', isOwn: false },
    { id: 'm6', sender: 'You', content: 'Absolutely! Create a party and share the code', time: '10:38 AM', isOwn: true },
    { id: 'm7', sender: 'MovieBuff', content: 'That movie was insane! 🔥', time: '10:40 AM', isOwn: false },
  ],
  '2': [
    { id: 'm1', sender: 'ChillVibes', content: 'Hey, I found this amazing lo-fi playlist', time: '9:00 AM', isOwn: false },
    { id: 'm2', sender: 'You', content: 'Share it!', time: '9:05 AM', isOwn: true },
    { id: 'm3', sender: 'ChillVibes', content: 'Starting a lo-fi party at 8pm', time: '9:10 AM', isOwn: false },
  ],
};

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <MessageCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Messages</h1>
          <p className="text-gray-400 mb-8">Sign in to view your messages</p>
          <Button onClick={() => setAuthOpen(true)} size="lg">Sign In</Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const activeConvo = MOCK_CONVERSATIONS.find((c) => c.id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const msg: Message = {
      id: `m${Date.now()}`,
      sender: 'You',
      content: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), msg],
    }));
    setNewMessage('');
  };

  const filteredConversations = MOCK_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List */}
      <div
        className={`w-full md:w-[380px] border-r border-white/5 flex flex-col ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-white/5">
          <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setActiveChat(convo.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                activeChat === convo.id ? 'bg-white/5' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{getInitials(convo.name)}</AvatarFallback>
                </Avatar>
                {convo.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{convo.name}</span>
                  <span className="text-xs text-gray-500">{convo.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 truncate">{convo.lastMessage}</span>
                  {convo.unread > 0 && (
                    <span className="ml-2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div
        className={`flex-1 flex flex-col ${
          !activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeChat && activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActiveChat(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{getInitials(activeConvo.name)}</AvatarFallback>
                  </Avatar>
                  {activeConvo.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{activeConvo.name}</h3>
                  <p className="text-xs text-emerald-400">{activeConvo.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.isOwn
                          ? 'gradient-primary text-white rounded-br-md'
                          : 'glass-light text-gray-200 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className={`text-[10px] text-gray-600 mt-1 block ${msg.isOwn ? 'text-right' : ''}`}>
                      {msg.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5">
                  <Smile className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-600">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
