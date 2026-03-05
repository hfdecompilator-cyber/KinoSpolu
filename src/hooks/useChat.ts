import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types';

export function useChat(partyId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    if (!partyId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profile:profiles(id, username, avatar_url)')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (mounted) {
        setMessages((data || []) as unknown as ChatMessage[]);
        setLoading(false);
        scrollToBottom();
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `party_id=eq.${partyId}`,
        },
        async (payload) => {
          if (!mounted) return;
          const { data } = await supabase
            .from('chat_messages')
            .select('*, profile:profiles(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data && mounted) {
            setMessages(prev => [...prev, data as unknown as ChatMessage]);
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          if (mounted) {
            setMessages(prev =>
              prev.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)
            );
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [partyId, scrollToBottom]);

  const sendMessage = useCallback(async (message: string) => {
    if (!partyId || !userId || !message.trim()) return;

    await supabase.from('chat_messages').insert({
      party_id: partyId,
      user_id: userId,
      message: message.trim(),
    });
  }, [partyId, userId]);

  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    await supabase
      .from('chat_messages')
      .update({ reaction })
      .eq('id', messageId);
  }, []);

  return { messages, loading, sendMessage, addReaction, bottomRef };
}
