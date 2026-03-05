import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  party_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export function useRealtimeChat(partyId: string | null, userId: string, userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  // Fetch initial messages
  useEffect(() => {
    if (!partyId) return;

    if (!configured) {
      setMessages([]);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('party_messages')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };

    fetch();
  }, [partyId, configured]);

  // Realtime subscription
  useEffect(() => {
    if (!partyId || !configured) return;

    const channel = supabase
      .channel(`party_messages:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, configured]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!partyId || !content.trim()) return false;

    if (!configured) {
      const msg: ChatMessage = {
        id: `local-${Date.now()}`,
        party_id: partyId,
        user_id: userId,
        user_name: userName,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      return true;
    }

    const { error } = await supabase.from('party_messages').insert({
      party_id: partyId,
      user_id: userId,
      user_name: userName,
      content: content.trim(),
    });

    return !error;
  }, [partyId, userId, userName, configured]);

  return { messages, loading, sendMessage };
}
