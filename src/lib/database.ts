import type { User, Party, ChatMessage } from '@/types';

const STORAGE_KEYS = {
  USERS: 'wp_users',
  PARTIES: 'wp_parties',
  CURRENT_USER: 'wp_current_user',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const db = {
  users: {
    getAll: (): User[] => read(STORAGE_KEYS.USERS, []),
    getById: (id: string): User | undefined =>
      read<User[]>(STORAGE_KEYS.USERS, []).find((u) => u.id === id),
    getByEmail: (email: string): User | undefined =>
      read<User[]>(STORAGE_KEYS.USERS, []).find((u) => u.email === email),
    getByUsername: (username: string): User | undefined =>
      read<User[]>(STORAGE_KEYS.USERS, []).find((u) => u.username === username),
    create: (user: User): User => {
      const users = read<User[]>(STORAGE_KEYS.USERS, []);
      users.push(user);
      write(STORAGE_KEYS.USERS, users);
      return user;
    },
    update: (id: string, updates: Partial<User>): User | undefined => {
      const users = read<User[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return undefined;
      users[idx] = { ...users[idx], ...updates };
      write(STORAGE_KEYS.USERS, users);
      return users[idx];
    },
    delete: (id: string): boolean => {
      const users = read<User[]>(STORAGE_KEYS.USERS, []);
      const filtered = users.filter((u) => u.id !== id);
      write(STORAGE_KEYS.USERS, filtered);
      return filtered.length < users.length;
    },
  },

  parties: {
    getAll: (): Party[] => read(STORAGE_KEYS.PARTIES, []),
    getById: (id: string): Party | undefined =>
      read<Party[]>(STORAGE_KEYS.PARTIES, []).find((p) => p.id === id),
    getByInviteCode: (code: string): Party | undefined =>
      read<Party[]>(STORAGE_KEYS.PARTIES, []).find((p) => p.inviteCode === code),
    getPublic: (): Party[] =>
      read<Party[]>(STORAGE_KEYS.PARTIES, []).filter(
        (p) => p.visibility === 'public' && p.status !== 'ended'
      ),
    getByHost: (hostId: string): Party[] =>
      read<Party[]>(STORAGE_KEYS.PARTIES, []).filter((p) => p.hostId === hostId),
    getByMember: (userId: string): Party[] =>
      read<Party[]>(STORAGE_KEYS.PARTIES, []).filter((p) =>
        p.members.some((m) => m.userId === userId)
      ),
    create: (party: Party): Party => {
      const parties = read<Party[]>(STORAGE_KEYS.PARTIES, []);
      parties.push(party);
      write(STORAGE_KEYS.PARTIES, parties);
      return party;
    },
    update: (id: string, updates: Partial<Party>): Party | undefined => {
      const parties = read<Party[]>(STORAGE_KEYS.PARTIES, []);
      const idx = parties.findIndex((p) => p.id === id);
      if (idx === -1) return undefined;
      parties[idx] = { ...parties[idx], ...updates };
      write(STORAGE_KEYS.PARTIES, parties);
      return parties[idx];
    },
    addMessage: (partyId: string, message: ChatMessage): void => {
      const parties = read<Party[]>(STORAGE_KEYS.PARTIES, []);
      const idx = parties.findIndex((p) => p.id === partyId);
      if (idx === -1) return;
      parties[idx].messages.push(message);
      write(STORAGE_KEYS.PARTIES, parties);
    },
    delete: (id: string): boolean => {
      const parties = read<Party[]>(STORAGE_KEYS.PARTIES, []);
      const filtered = parties.filter((p) => p.id !== id);
      write(STORAGE_KEYS.PARTIES, filtered);
      return filtered.length < parties.length;
    },
  },

  session: {
    get: (): string | null => localStorage.getItem(STORAGE_KEYS.CURRENT_USER),
    set: (userId: string): void => localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId),
    clear: (): void => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
  },
};
