import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as AppUser } from '@/types';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithMagicLink: (email: string) => Promise<boolean>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<AppUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  updateProfile: (data) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  },

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('watchparty_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch { /* ignore */ }
      }
      set({ isLoading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
        };
        set({ user: appUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
          };
          set({ user: appUser, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured()) {
      const user: AppUser = {
        id: crypto.randomUUID(),
        email,
        username,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('watchparty_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      if (data.user) {
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || '',
          username,
          created_at: data.user.created_at,
        };
        set({ user: appUser, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Sign up failed', isLoading: false });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured()) {
      const user: AppUser = {
        id: crypto.randomUUID(),
        email,
        username: email.split('@')[0],
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('watchparty_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      if (data.user) {
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };
        set({ user: appUser, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Sign in failed', isLoading: false });
      return false;
    }
  },

  signInWithMagicLink: async (email) => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured()) {
      set({ error: null, isLoading: false });
      return true;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to send magic link', isLoading: false });
      return false;
    }
  },

  signInWithOAuth: async (provider) => {
    if (!isSupabaseConfigured()) {
      const user: AppUser = {
        id: crypto.randomUUID(),
        email: `${provider}user@example.com`,
        username: `${provider}_user`,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('watchparty_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return;
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err: any) {
      set({ error: err.message || 'OAuth sign in failed' });
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('watchparty_user');
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
