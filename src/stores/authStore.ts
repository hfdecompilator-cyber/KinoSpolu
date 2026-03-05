import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { User, StreamingService, ServiceAuth } from '@/types';
import { db } from '@/lib/database';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => void;
  signUp: (username: string, email: string, password: string, displayName: string) => boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
  connectService: (service: StreamingService) => void;
  disconnectService: (service: StreamingService) => void;
  isServiceConnected: (service: StreamingService) => boolean;
  getConnectedServices: () => StreamingService[];
}

const PASSWORDS_KEY = 'wp_passwords';

function getPasswords(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setPassword(email: string, password: string): void {
  const passwords = getPasswords();
  passwords[email] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: () => {
    const sessionUserId = db.session.get();
    if (sessionUserId) {
      const user = db.users.getById(sessionUserId);
      if (user) {
        set({ user, isLoading: false });
        return;
      }
    }
    set({ isLoading: false });
  },

  signUp: (username, email, password, displayName) => {
    if (db.users.getByEmail(email)) {
      set({ error: 'An account with this email already exists' });
      return false;
    }
    if (db.users.getByUsername(username)) {
      set({ error: 'This username is already taken' });
      return false;
    }

    const defaultServices: ServiceAuth[] = [
      'netflix', 'youtube', 'spotify', 'twitch', 'prime',
      'disney', 'hbo', 'apple', 'hulu', 'paramount',
    ].map((s) => ({
      service: s as StreamingService,
      connected: false,
      connectedAt: null,
      username: null,
    }));

    const user: User = {
      id: uuid(),
      username,
      displayName,
      email,
      avatarUrl: null,
      bio: '',
      createdAt: new Date().toISOString(),
      connectedServices: defaultServices,
      friends: [],
      partiesHosted: 0,
      partiesJoined: 0,
    };

    db.users.create(user);
    setPassword(email, password);
    db.session.set(user.id);
    set({ user, error: null });
    return true;
  },

  signIn: (email, password) => {
    const user = db.users.getByEmail(email);
    if (!user) {
      set({ error: 'No account found with this email' });
      return false;
    }
    const passwords = getPasswords();
    if (passwords[email] !== password) {
      set({ error: 'Invalid password' });
      return false;
    }
    db.session.set(user.id);
    set({ user, error: null });
    return true;
  },

  signOut: () => {
    db.session.clear();
    set({ user: null, error: null });
  },

  updateProfile: (updates) => {
    const { user } = get();
    if (!user) return;
    const updated = db.users.update(user.id, updates);
    if (updated) set({ user: updated });
  },

  connectService: (service) => {
    const { user } = get();
    if (!user) return;

    const connectedServices = user.connectedServices.map((s) =>
      s.service === service
        ? { ...s, connected: true, connectedAt: new Date().toISOString(), username: user.username }
        : s
    );
    const updated = db.users.update(user.id, { connectedServices });
    if (updated) set({ user: updated });
  },

  disconnectService: (service) => {
    const { user } = get();
    if (!user) return;

    const connectedServices = user.connectedServices.map((s) =>
      s.service === service
        ? { ...s, connected: false, connectedAt: null, username: null }
        : s
    );
    const updated = db.users.update(user.id, { connectedServices });
    if (updated) set({ user: updated });
  },

  isServiceConnected: (service) => {
    const { user } = get();
    if (!user) return false;
    return user.connectedServices.some((s) => s.service === service && s.connected);
  },

  getConnectedServices: () => {
    const { user } = get();
    if (!user) return [];
    return user.connectedServices.filter((s) => s.connected).map((s) => s.service);
  },
}));
