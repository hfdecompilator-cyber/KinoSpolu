import { create } from 'zustand';
import type { Party, ChatMessage, VoiceMember, PartyMember } from '@/types';
import { generatePartyCode, randomColor } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const SAMPLE_PARTIES: Party[] = [
  {
    id: '1',
    name: 'Friday Movie Night',
    code: 'FMN247',
    host_id: 'host1',
    host_name: 'MovieBuff',
    description: 'Join us for an epic movie marathon!',
    media_title: 'Interstellar',
    media_type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=225&fit=crop',
    max_members: 20,
    current_members: 8,
    is_private: false,
    is_live: true,
    genre: 'Sci-Fi',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Anime Watch Party',
    code: 'ANI369',
    host_id: 'host2',
    host_name: 'OtakuKing',
    description: 'Binge-watching the latest anime hits together!',
    media_title: 'Attack on Titan',
    media_type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=225&fit=crop',
    max_members: 50,
    current_members: 23,
    is_private: false,
    is_live: true,
    genre: 'Anime',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Lo-Fi & Chill',
    code: 'LFC789',
    host_id: 'host3',
    host_name: 'ChillVibes',
    description: 'Relax with lo-fi beats and great company',
    media_title: 'Lo-Fi Radio',
    media_type: 'music',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
    max_members: 100,
    current_members: 47,
    is_private: false,
    is_live: true,
    genre: 'Music',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Horror Film Club',
    code: 'HFC666',
    host_id: 'host4',
    host_name: 'ScaryMary',
    description: 'Only the scariest movies. Not for the faint of heart!',
    media_title: 'The Conjuring',
    media_type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1509248961895-40216eaac488?w=400&h=225&fit=crop',
    max_members: 15,
    current_members: 12,
    is_private: false,
    is_live: true,
    genre: 'Horror',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Documentary Hour',
    code: 'DOC101',
    host_id: 'host5',
    host_name: 'LearnMore',
    description: 'Expand your mind with fascinating documentaries',
    media_title: 'Planet Earth III',
    media_type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop',
    max_members: 30,
    current_members: 15,
    is_private: false,
    is_live: true,
    genre: 'Documentary',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'K-Drama Together',
    code: 'KDR555',
    host_id: 'host6',
    host_name: 'DramaFan',
    description: 'Watch the latest K-Dramas with fellow fans!',
    media_title: 'Squid Game S2',
    media_type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=225&fit=crop',
    max_members: 25,
    current_members: 19,
    is_private: false,
    is_live: true,
    genre: 'Drama',
    created_at: new Date().toISOString(),
  },
];

interface PartyState {
  parties: Party[];
  currentParty: Party | null;
  messages: ChatMessage[];
  voiceMembers: VoiceMember[];
  partyMembers: PartyMember[];
  isInVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  fetchParties: () => void;
  createParty: (data: Partial<Party>) => Party;
  joinParty: (code: string, userId: string, username: string) => Party | null;
  leaveParty: () => void;
  sendMessage: (content: string, userId: string, username: string, avatarUrl?: string) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  joinVoice: (userId: string, username: string) => void;
  leaveVoice: () => void;
  subscribeToChat: (partyId: string) => () => void;
}

export const usePartyStore = create<PartyState>((set, get) => ({
  parties: SAMPLE_PARTIES,
  currentParty: null,
  messages: [],
  voiceMembers: [],
  partyMembers: [],
  isInVoice: false,
  isMuted: false,
  isDeafened: false,

  fetchParties: () => {
    set({ parties: SAMPLE_PARTIES });
  },

  createParty: (data) => {
    const party: Party = {
      id: crypto.randomUUID(),
      name: data.name || 'New Party',
      code: generatePartyCode(),
      host_id: data.host_id || '',
      host_name: data.host_name || 'Host',
      description: data.description,
      media_url: data.media_url,
      media_title: data.media_title,
      media_type: data.media_type || 'video',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=225&fit=crop',
      max_members: data.max_members || 20,
      current_members: 1,
      is_private: data.is_private || false,
      is_live: true,
      genre: data.genre,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ parties: [party, ...s.parties], currentParty: party }));
    return party;
  },

  joinParty: (code, userId, username) => {
    const { parties } = get();
    const party = parties.find((p) => p.code.toUpperCase() === code.toUpperCase());
    if (!party) return null;
    if (party.current_members >= party.max_members) return null;

    const updatedParty = { ...party, current_members: party.current_members + 1 };
    set((s) => ({
      parties: s.parties.map((p) => (p.id === party.id ? updatedParty : p)),
      currentParty: updatedParty,
      partyMembers: [
        ...s.partyMembers,
        {
          id: crypto.randomUUID(),
          user_id: userId,
          party_id: party.id,
          username,
          role: 'member',
          joined_at: new Date().toISOString(),
        },
      ],
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          party_id: party.id,
          user_id: 'system',
          username: 'System',
          content: `${username} joined the party!`,
          type: 'system',
          created_at: new Date().toISOString(),
        },
      ],
    }));
    return updatedParty;
  },

  leaveParty: () => {
    set({ currentParty: null, messages: [], voiceMembers: [], partyMembers: [], isInVoice: false });
  },

  sendMessage: (content, userId, username, avatarUrl) => {
    const { currentParty } = get();
    if (!currentParty) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      party_id: currentParty.id,
      user_id: userId,
      username,
      avatar_url: avatarUrl,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
    };

    set((s) => ({ messages: [...s.messages, msg] }));

    if (isSupabaseConfigured()) {
      supabase.channel(`party-${currentParty.id}`).send({
        type: 'broadcast',
        event: 'chat',
        payload: msg,
      });
    }
  },

  subscribeToChat: (partyId) => {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'chat' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        set((s) => {
          if (s.messages.some((m) => m.id === msg.id)) return s;
          return { messages: [...s.messages, msg] };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleDeafen: () => set((s) => ({ isDeafened: !s.isDeafened })),

  joinVoice: (userId, username) => {
    const member: VoiceMember = {
      id: userId,
      username,
      isMuted: false,
      isSpeaking: false,
      isDeafened: false,
    };
    set((s) => ({
      isInVoice: true,
      voiceMembers: [...s.voiceMembers.filter((m) => m.id !== userId), member],
    }));

    const interval = setInterval(() => {
      set((s) => ({
        voiceMembers: s.voiceMembers.map((m) =>
          m.id !== userId ? { ...m, isSpeaking: Math.random() > 0.6 } : m
        ),
      }));
    }, 2000);

    const currentMembers: VoiceMember[] = [
      { id: 'bot1', username: 'MovieBuff', isMuted: false, isSpeaking: false, isDeafened: false },
      { id: 'bot2', username: 'ChillVibes', isMuted: true, isSpeaking: false, isDeafened: false },
      { id: 'bot3', username: 'OtakuKing', isMuted: false, isSpeaking: false, isDeafened: false },
    ];
    set((s) => ({ voiceMembers: [...currentMembers, ...s.voiceMembers] }));

    return () => clearInterval(interval);
  },

  leaveVoice: () => {
    set({ isInVoice: false, voiceMembers: [], isMuted: false, isDeafened: false });
  },
}));
