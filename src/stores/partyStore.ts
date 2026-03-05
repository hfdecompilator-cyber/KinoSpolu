import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Party, CreatePartyInput, ChatMessage, PartyMember, StreamingService } from '@/types';
import { db } from '@/lib/database';
import { SAMPLE_THUMBNAILS } from '@/lib/constants';
import { useAuthStore } from './authStore';

interface PartyState {
  parties: Party[];
  currentParty: Party | null;
  isLoading: boolean;

  loadParties: () => void;
  createParty: (input: CreatePartyInput) => Party | null;
  joinParty: (partyId: string) => boolean;
  leaveParty: (partyId: string) => void;
  sendMessage: (partyId: string, content: string) => void;
  updatePartyStatus: (partyId: string, status: Party['status']) => void;
  setCurrentParty: (partyId: string | null) => void;
  deleteParty: (partyId: string) => void;

  getPublicParties: () => Party[];
  getFilteredParties: (services: StreamingService[]) => Party[];
  getMyParties: () => Party[];
  canJoinParty: (party: Party) => boolean;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const usePartyStore = create<PartyState>((set, get) => ({
  parties: [],
  currentParty: null,
  isLoading: false,

  loadParties: () => {
    const parties = db.parties.getAll();
    set({ parties });
  },

  createParty: (input) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;

    const party: Party = {
      id: uuid(),
      name: input.name,
      description: input.description,
      hostId: user.id,
      hostUsername: user.username,
      hostDisplayName: user.displayName,
      service: input.service,
      contentTitle: input.contentTitle,
      contentUrl: input.contentUrl,
      visibility: input.visibility,
      status: 'waiting',
      maxMembers: input.maxMembers,
      members: [
        {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date().toISOString(),
          isHost: true,
          isReady: true,
        },
      ],
      messages: [
        {
          id: uuid(),
          partyId: '',
          userId: 'system',
          username: 'system',
          displayName: 'WatchParty',
          avatarUrl: null,
          content: `${user.displayName} created the party. Waiting for others to join...`,
          type: 'system',
          createdAt: new Date().toISOString(),
        },
      ],
      inviteCode: generateInviteCode(),
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      tags: input.tags,
      thumbnailUrl: SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)],
    };
    party.messages[0].partyId = party.id;

    db.parties.create(party);
    const updatedUser = db.users.update(user.id, { partiesHosted: user.partiesHosted + 1 });
    if (updatedUser) useAuthStore.setState({ user: updatedUser });

    set((state) => ({ parties: [...state.parties, party] }));
    return party;
  },

  joinParty: (partyId) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const party = db.parties.getById(partyId);
    if (!party) return false;

    if (party.members.some((m) => m.userId === user.id)) return true;
    if (party.members.length >= party.maxMembers) return false;
    if (party.status === 'ended') return false;

    const member: PartyMember = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      joinedAt: new Date().toISOString(),
      isHost: false,
      isReady: false,
    };

    const joinMsg: ChatMessage = {
      id: uuid(),
      partyId,
      userId: 'system',
      username: 'system',
      displayName: 'WatchParty',
      avatarUrl: null,
      content: `${user.displayName} joined the party!`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };

    const updated = db.parties.update(partyId, {
      members: [...party.members, member],
      messages: [...party.messages, joinMsg],
    });

    if (updated) {
      const updatedUser = db.users.update(user.id, { partiesJoined: user.partiesJoined + 1 });
      if (updatedUser) useAuthStore.setState({ user: updatedUser });
      set((state) => ({
        parties: state.parties.map((p) => (p.id === partyId ? updated : p)),
        currentParty: state.currentParty?.id === partyId ? updated : state.currentParty,
      }));
    }
    return true;
  },

  leaveParty: (partyId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const party = db.parties.getById(partyId);
    if (!party) return;

    const leaveMsg: ChatMessage = {
      id: uuid(),
      partyId,
      userId: 'system',
      username: 'system',
      displayName: 'WatchParty',
      avatarUrl: null,
      content: `${user.displayName} left the party.`,
      type: 'system',
      createdAt: new Date().toISOString(),
    };

    const updated = db.parties.update(partyId, {
      members: party.members.filter((m) => m.userId !== user.id),
      messages: [...party.messages, leaveMsg],
    });

    if (updated) {
      set((state) => ({
        parties: state.parties.map((p) => (p.id === partyId ? updated : p)),
        currentParty: state.currentParty?.id === partyId ? null : state.currentParty,
      }));
    }
  },

  sendMessage: (partyId, content) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const message: ChatMessage = {
      id: uuid(),
      partyId,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    db.parties.addMessage(partyId, message);

    set((state) => ({
      parties: state.parties.map((p) =>
        p.id === partyId ? { ...p, messages: [...p.messages, message] } : p
      ),
      currentParty:
        state.currentParty?.id === partyId
          ? { ...state.currentParty, messages: [...state.currentParty.messages, message] }
          : state.currentParty,
    }));
  },

  updatePartyStatus: (partyId, status) => {
    const updated = db.parties.update(partyId, {
      status,
      ...(status === 'watching' ? { startedAt: new Date().toISOString() } : {}),
      ...(status === 'ended' ? { endedAt: new Date().toISOString() } : {}),
    });
    if (updated) {
      set((state) => ({
        parties: state.parties.map((p) => (p.id === partyId ? updated : p)),
        currentParty: state.currentParty?.id === partyId ? updated : state.currentParty,
      }));
    }
  },

  setCurrentParty: (partyId) => {
    if (!partyId) {
      set({ currentParty: null });
      return;
    }
    const party = db.parties.getById(partyId);
    set({ currentParty: party || null });
  },

  deleteParty: (partyId) => {
    db.parties.delete(partyId);
    set((state) => ({
      parties: state.parties.filter((p) => p.id !== partyId),
      currentParty: state.currentParty?.id === partyId ? null : state.currentParty,
    }));
  },

  getPublicParties: () => {
    return get().parties.filter((p) => p.visibility === 'public' && p.status !== 'ended');
  },

  getFilteredParties: (services) => {
    if (services.length === 0) return [];
    return get()
      .parties.filter(
        (p) =>
          p.visibility === 'public' &&
          p.status !== 'ended' &&
          services.includes(p.service)
      );
  },

  getMyParties: () => {
    const user = useAuthStore.getState().user;
    if (!user) return [];
    return get().parties.filter((p) => p.members.some((m) => m.userId === user.id));
  },

  canJoinParty: (party) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;
    if (party.status === 'ended') return false;
    if (party.members.length >= party.maxMembers) return false;
    if (party.members.some((m) => m.userId === user.id)) return true;

    const hasService = user.connectedServices.some(
      (s) => s.service === party.service && s.connected
    );
    return hasService;
  },
}));
