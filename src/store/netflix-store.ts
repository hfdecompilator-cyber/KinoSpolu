import { create } from 'zustand';
import { netflixApi, type NetflixProfile, type ContentCategory } from '@/lib/api';

interface NetflixState {
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  error: string | null;
  email: string | null;
  profiles: NetflixProfile[];
  selectedProfile: NetflixProfile | null;
  content: ContentCategory[];

  login: (email: string, password: string) => Promise<boolean>;
  loginDemo: () => Promise<boolean>;
  loadProfiles: () => Promise<void>;
  selectProfile: (profile: NetflixProfile) => Promise<void>;
  loadContent: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useNetflixStore = create<NetflixState>((set, get) => ({
  isAuthenticated: false,
  isDemo: false,
  isLoading: false,
  error: null,
  email: null,
  profiles: [],
  selectedProfile: null,
  content: [],

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await netflixApi.login(email, password);
      set({ isAuthenticated: true, isDemo: result.isDemo, email, isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await netflixApi.loginDemo();
      set({ isAuthenticated: true, isDemo: true, email: 'demo@example.com', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: 'Failed to start demo mode.', isLoading: false });
      return false;
    }
  },

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const { profiles } = await netflixApi.getProfiles();
      set({ profiles, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to load profiles.', isLoading: false });
    }
  },

  selectProfile: async (profile) => {
    try {
      await netflixApi.selectProfile(profile.id, profile.name, profile.avatar);
      set({ selectedProfile: profile });
    } catch {
      set({ error: 'Failed to select profile.' });
    }
  },

  loadContent: async () => {
    set({ isLoading: true });
    try {
      const { content } = await netflixApi.browse();
      set({ content, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await netflixApi.logout(); } catch {}
    set({
      isAuthenticated: false,
      isDemo: false,
      email: null,
      profiles: [],
      selectedProfile: null,
      content: [],
      error: null,
    });
  },

  checkSession: async () => {
    const sessionId = localStorage.getItem('netflix_session_id');
    if (!sessionId) return false;

    try {
      const data = await netflixApi.getSession();
      if (data.success) {
        set({
          isAuthenticated: true,
          isDemo: data.isDemo,
          email: data.email,
          selectedProfile: data.profile,
        });
        return true;
      }
    } catch {}
    localStorage.removeItem('netflix_session_id');
    return false;
  },

  clearError: () => set({ error: null }),
}));
