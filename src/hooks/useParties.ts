import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generatePartyCode } from '@/lib/utils';
import { addDemoParty, getDemoPartyByCode } from '@/lib/partiesStore';

export interface Party {
  id: string;
  code: string;
  name: string;
  description: string | null;
  host_id: string;
  video_url: string | null;
  video_title: string | null;
  video_source: string | null;
  playback_position: number;
  is_playing: boolean;
  created_at: string;
}

export interface CreatePartyParams {
  name: string;
  description?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoSource?: string;
  hostId: string;
  hostName: string;
}

export function useParties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const createParty = useCallback(async (params: CreatePartyParams): Promise<Party | null> => {
    setLoading(true);
    const code = generatePartyCode();

    if (!configured) {
      const party: Party = {
        id: `local-${Date.now()}`,
        code,
        name: params.name,
        description: params.description || null,
        host_id: params.hostId,
        video_url: params.videoUrl || null,
        video_title: params.videoTitle || null,
        video_source: params.videoSource || 'youtube',
        playback_position: 0,
        is_playing: false,
        created_at: new Date().toISOString(),
      };
      addDemoParty(party);
      setParties((p) => [...p, party]);
      setLoading(false);
      return party;
    }

    try {
      const { data, error } = await supabase
        .from('parties')
        .insert({
          code,
          name: params.name,
          description: params.description || null,
          host_id: params.hostId,
          video_url: params.videoUrl || null,
          video_title: params.videoTitle || null,
          video_source: params.videoSource || 'youtube',
        })
        .select()
        .single();

      if (error) throw error;
      setParties((p) => [...p, data]);
      return data;
    } catch (err) {
      console.error('Create party error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const joinPartyByCode = useCallback(async (code: string, userId: string, userName: string): Promise<Party | null> => {
    setLoading(true);

    if (!configured) {
      const party = getDemoPartyByCode(code) || parties.find((p) => p.code.toUpperCase() === code.toUpperCase());
      setLoading(false);
      return party || null;
    }

    try {
      const { data: party, error } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !party) {
        setLoading(false);
        return null;
      }

      await supabase.from('party_members').upsert({
        party_id: party.id,
        user_id: userId,
        user_name: userName,
      });

      setLoading(false);
      return party;
    } catch (err) {
      console.error('Join party error:', err);
      setLoading(false);
      return null;
    }
  }, [configured, parties]);

  const getPartyByCode = useCallback(async (code: string): Promise<Party | null> => {
    if (!configured) {
      return getDemoPartyByCode(code) || parties.find((p) => p.code.toUpperCase() === code.toUpperCase()) || null;
    }
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    if (error) return null;
    return data;
  }, [configured, parties]);

  const updatePlayback = useCallback(async (partyId: string, position: number, isPlaying: boolean) => {
    if (!configured) return;
    await supabase
      .from('parties')
      .update({ playback_position: position, is_playing: isPlaying })
      .eq('id', partyId);
  }, [configured]);

  return { parties, loading, createParty, joinPartyByCode, getPartyByCode, updatePlayback };
}
