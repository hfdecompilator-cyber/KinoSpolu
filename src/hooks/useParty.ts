import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Party, PartyMember } from '@/types';
import { generatePartyCode, isYouTubeUrl } from '@/lib/utils';

export function useParty(partyId?: string) {
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParty = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        host:profiles!parties_host_id_fkey(id, username, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      setError(error.message);
      return null;
    }
    return data as unknown as Party;
  }, []);

  const fetchMembers = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('party_members')
      .select('*, profile:profiles(id, username, avatar_url)')
      .eq('party_id', id);
    return (data || []) as unknown as PartyMember[];
  }, []);

  useEffect(() => {
    if (!partyId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      const [partyData, membersData] = await Promise.all([
        fetchParty(partyId),
        fetchMembers(partyId),
      ]);

      if (!mounted) return;
      setParty(partyData);
      setMembers(membersData);
      setLoading(false);
    };

    load();

    const partyChannel = supabase
      .channel(`party:${partyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` },
        (payload) => {
          if (mounted) setParty(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` },
        async () => {
          if (mounted) {
            const membersData = await fetchMembers(partyId);
            setMembers(membersData);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` },
        async () => {
          if (mounted) {
            const membersData = await fetchMembers(partyId);
            setMembers(membersData);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(partyChannel);
    };
  }, [partyId, fetchParty, fetchMembers]);

  const createParty = useCallback(async (
    name: string,
    videoUrl: string,
    hostId: string
  ) => {
    const partyCode = generatePartyCode();
    const videoType = videoUrl ? (isYouTubeUrl(videoUrl) ? 'youtube' : 'direct') : null;

    const { data, error } = await supabase
      .from('parties')
      .insert({
        name,
        host_id: hostId,
        video_url: videoUrl || null,
        video_type: videoType,
        party_code: partyCode,
        is_playing: false,
        current_time: 0,
      })
      .select()
      .single();

    if (error) return { data: null, error };

    await supabase
      .from('party_members')
      .insert({ party_id: data.id, user_id: hostId });

    return { data: data as Party, error: null };
  }, []);

  const joinParty = useCallback(async (partyCode: string, userId: string) => {
    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('*')
      .eq('party_code', partyCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (partyError || !partyData) {
      return { data: null, error: new Error('Party not found or no longer active') };
    }

    const { error: memberError } = await supabase
      .from('party_members')
      .upsert({ party_id: partyData.id, user_id: userId });

    if (memberError) return { data: null, error: memberError };

    return { data: partyData as Party, error: null };
  }, []);

  const leaveParty = useCallback(async (partyId: string, userId: string, isHost: boolean) => {
    if (isHost) {
      await supabase
        .from('parties')
        .update({ is_active: false })
        .eq('id', partyId);
    } else {
      await supabase
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', userId);
    }
  }, []);

  const updateVideoState = useCallback(async (
    partyId: string,
    isPlaying: boolean,
    currentTime: number
  ) => {
    await supabase
      .from('parties')
      .update({ is_playing: isPlaying, current_time: currentTime })
      .eq('id', partyId);
  }, []);

  const updateVideoUrl = useCallback(async (partyId: string, videoUrl: string) => {
    const videoType = isYouTubeUrl(videoUrl) ? 'youtube' : 'direct';
    await supabase
      .from('parties')
      .update({ video_url: videoUrl, video_type: videoType, current_time: 0, is_playing: false })
      .eq('id', partyId);
  }, []);

  return {
    party,
    members,
    loading,
    error,
    createParty,
    joinParty,
    leaveParty,
    updateVideoState,
    updateVideoUrl,
    setParty,
  };
}

export function useMyParties(userId: string | undefined) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchParties = async () => {
      const { data } = await supabase
        .from('party_members')
        .select(`
          party:parties(
            *,
            host:profiles!parties_host_id_fkey(id, username, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      const partiesList = (data || [])
        .map((d: { party: Party | null }) => d.party)
        .filter((p: Party | null): p is Party => p !== null && p.is_active);

      setParties(partiesList);
      setLoading(false);
    };

    fetchParties();
  }, [userId]);

  return { parties, loading };
}
