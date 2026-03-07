import { create } from 'zustand';
import { v4 as uid } from 'uuid';
import type { User, Lobby, ChatMsg, LobbyMember, Service } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LS = {
  get: <T>(k: string, d: T): T => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } },
  set: <T>(k: string, v: T) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k: string) => localStorage.removeItem(k),
};

function makeCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || '';
}

interface Store {
  user: User | null;
  lobbies: Lobby[];
  current: Lobby | null;
  loading: boolean;

  init: () => void;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  connectService: (svc: Service) => void;
  disconnectService: (svc: Service) => void;

  loadLobbies: () => void;
  createLobby: (title: string, videoUrl: string, service: Service, visibility: 'private' | 'public') => Lobby;
  joinLobby: (lobbyId: string) => boolean;
  joinByCode: (code: string) => Lobby | null;
  leaveLobby: () => void;
  setCurrent: (id: string | null) => void;
  setStatus: (s: Lobby['status']) => void;
  sendMsg: (text: string) => void;
  getPublicLobbies: () => Lobby[];
  canJoin: (lobby: Lobby) => boolean;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  lobbies: [],
  current: null,
  loading: true,

  init: () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const u = data.session.user;
          const meta = u.user_metadata || {};
          const user: User = {
            id: u.id,
            name: meta.name || u.email?.split('@')[0] || 'User',
            email: u.email || '',
            avatar: (meta.name || 'U').slice(0, 2).toUpperCase(),
            connectedServices: meta.connectedServices || [],
            createdAt: u.created_at,
          };
          set({ user, loading: false });
        } else {
          set({ loading: false });
        }
      });
    } else {
      const userId = LS.get<string | null>('gs_uid', null);
      if (userId) {
        const users = LS.get<User[]>('gs_users', []);
        const u = users.find((x) => x.id === userId);
        if (u) set({ user: u });
      }
      set({ loading: false });
    }
    get().loadLobbies();
  },

  signUp: async (name, email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, connectedServices: [] } },
      });
      if (error || !data.user) return false;
      const user: User = {
        id: data.user.id, name, email,
        avatar: name.slice(0, 2).toUpperCase(),
        connectedServices: [], createdAt: new Date().toISOString(),
      };
      set({ user });
      return true;
    }
    const users = LS.get<User[]>('gs_users', []);
    if (users.find((x) => x.email === email)) return false;
    const user: User = {
      id: uid(), name, email,
      avatar: name.slice(0, 2).toUpperCase(),
      connectedServices: [], createdAt: new Date().toISOString(),
    };
    users.push(user);
    LS.set('gs_users', users);
    LS.set('gs_pwd_' + email, password);
    LS.set('gs_uid', user.id);
    set({ user });
    return true;
  },

  signIn: async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return false;
      const meta = data.user.user_metadata || {};
      const user: User = {
        id: data.user.id,
        name: meta.name || email.split('@')[0],
        email,
        avatar: (meta.name || 'U').slice(0, 2).toUpperCase(),
        connectedServices: meta.connectedServices || [],
        createdAt: data.user.created_at,
      };
      set({ user });
      return true;
    }
    const users = LS.get<User[]>('gs_users', []);
    const u = users.find((x) => x.email === email);
    if (!u) return false;
    const stored = LS.get<string>('gs_pwd_' + email, '');
    if (stored !== password) return false;
    LS.set('gs_uid', u.id);
    set({ user: u });
    return true;
  },

  signOut: () => {
    if (isSupabaseConfigured && supabase) supabase.auth.signOut();
    LS.del('gs_uid');
    set({ user: null, current: null });
  },

  connectService: (svc) => {
    const { user } = get();
    if (!user) return;
    if (user.connectedServices.includes(svc)) return;
    const updated = { ...user, connectedServices: [...user.connectedServices, svc] };
    set({ user: updated });
    if (isSupabaseConfigured && supabase) {
      supabase.auth.updateUser({ data: { connectedServices: updated.connectedServices } });
    } else {
      const users = LS.get<User[]>('gs_users', []);
      LS.set('gs_users', users.map((u) => u.id === user.id ? updated : u));
    }
  },

  disconnectService: (svc) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, connectedServices: user.connectedServices.filter((s) => s !== svc) };
    set({ user: updated });
    if (isSupabaseConfigured && supabase) {
      supabase.auth.updateUser({ data: { connectedServices: updated.connectedServices } });
    } else {
      const users = LS.get<User[]>('gs_users', []);
      LS.set('gs_users', users.map((u) => u.id === user.id ? updated : u));
    }
  },

  loadLobbies: () => {
    set({ lobbies: LS.get<Lobby[]>('gs_lobbies', []) });
  },

  createLobby: (title, videoUrl, service, visibility) => {
    const u = get().user!;
    const videoId = service === 'youtube' ? extractYouTubeId(videoUrl) : '';
    const lobby: Lobby = {
      id: uid(), code: makeCode(), hostId: u.id, hostName: u.name,
      title, videoUrl, videoId, service, status: 'waiting', visibility,
      members: [{ userId: u.id, name: u.name, avatar: u.avatar, isHost: true, joinedAt: new Date().toISOString() }],
      messages: [{ id: uid(), lobbyId: '', userId: 'sys', name: 'System', text: `${u.name} created this room`, ts: new Date().toISOString(), type: 'system' }],
      maxMembers: 20, createdAt: new Date().toISOString(),
    };
    lobby.messages[0].lobbyId = lobby.id;
    const lobbies = [...get().lobbies, lobby];
    LS.set('gs_lobbies', lobbies);
    set({ lobbies, current: lobby });
    return lobby;
  },

  joinLobby: (lobbyId) => {
    const u = get().user;
    if (!u) return false;
    const lobbies = get().lobbies.map((l) => {
      if (l.id !== lobbyId) return l;
      if (l.members.some((m) => m.userId === u.id)) return l;
      if (l.members.length >= l.maxMembers) return l;
      return {
        ...l,
        members: [...l.members, { userId: u.id, name: u.name, avatar: u.avatar, isHost: false, joinedAt: new Date().toISOString() }],
        messages: [...l.messages, { id: uid(), lobbyId: l.id, userId: 'sys', name: 'System', text: `${u.name} joined`, ts: new Date().toISOString(), type: 'system' as const }],
      };
    });
    LS.set('gs_lobbies', lobbies);
    const current = lobbies.find((l) => l.id === lobbyId) || null;
    set({ lobbies, current });
    return true;
  },

  joinByCode: (code) => {
    const lobby = get().lobbies.find((l) => l.code === code.toUpperCase() && l.status !== 'ended');
    if (!lobby) return null;
    get().joinLobby(lobby.id);
    return get().lobbies.find((l) => l.id === lobby.id) || null;
  },

  leaveLobby: () => {
    const u = get().user;
    const c = get().current;
    if (!u || !c) return;
    const lobbies = get().lobbies.map((l) => {
      if (l.id !== c.id) return l;
      return { ...l, members: l.members.filter((m) => m.userId !== u.id), messages: [...l.messages, { id: uid(), lobbyId: l.id, userId: 'sys', name: 'System', text: `${u.name} left`, ts: new Date().toISOString(), type: 'system' as const }] };
    });
    LS.set('gs_lobbies', lobbies);
    set({ lobbies, current: null });
  },

  setCurrent: (id) => {
    if (!id) { set({ current: null }); return; }
    const lobbies = LS.get<Lobby[]>('gs_lobbies', []);
    set({ lobbies, current: lobbies.find((l) => l.id === id) || null });
  },

  setStatus: (s) => {
    const c = get().current;
    if (!c) return;
    const lobbies = get().lobbies.map((l) => l.id === c.id ? { ...l, status: s } : l);
    LS.set('gs_lobbies', lobbies);
    set({ lobbies, current: lobbies.find((l) => l.id === c.id) || null });
  },

  sendMsg: (text) => {
    const u = get().user;
    const c = get().current;
    if (!u || !c) return;
    const msg: ChatMsg = { id: uid(), lobbyId: c.id, userId: u.id, name: u.name, text, ts: new Date().toISOString(), type: 'user' };
    const lobbies = get().lobbies.map((l) => l.id === c.id ? { ...l, messages: [...l.messages, msg] } : l);
    LS.set('gs_lobbies', lobbies);
    set({ lobbies, current: lobbies.find((l) => l.id === c.id) || null });
  },

  getPublicLobbies: () => get().lobbies.filter((l) => l.visibility === 'public' && l.status !== 'ended'),

  canJoin: (lobby) => {
    const u = get().user;
    if (!u) return false;
    if (lobby.members.some((m) => m.userId === u.id)) return true;
    if (lobby.members.length >= lobby.maxMembers) return false;
    return u.connectedServices.includes(lobby.service);
  },
}));
