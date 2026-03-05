import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, STORAGE_KEYS } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const loadLocalUser = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    const netflixAuth = localStorage.getItem(STORAGE_KEYS.NETFLIX_AUTH);
    if (stored) {
      const u = JSON.parse(stored) as User;
      if (netflixAuth) {
        const na = JSON.parse(netflixAuth);
        u.netflixConnected = na.connected;
        u.netflixProfileName = na.profileName;
        u.netflixConnectedAt = na.connectedAt;
      }
      setState({ user: u, loading: false, error: null });
    } else {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
            netflixConnected: false,
          };
          setState({ user: u, loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email ?? '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            netflixConnected: false,
          };
          setState({ user: u, loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      });
      return () => subscription.unsubscribe();
    } else {
      loadLocalUser();
    }
  }, [loadLocalUser]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setState(s => ({ ...s, loading: false, error: error.message }));
        return false;
      }
      if (data.user) {
        const u: User = {
          id: data.user.id,
          email,
          username,
          netflixConnected: false,
        };
        setState({ user: u, loading: false, error: null });
      }
      return true;
    } else {
      // Demo mode: local storage auth
      const u: User = {
        id: generateId(),
        email,
        username,
        netflixConnected: false,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
      setState({ user: u, loading: false, error: null });
      return true;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState(s => ({ ...s, loading: false, error: error.message }));
        return false;
      }
      if (data.user) {
        const u: User = {
          id: data.user.id,
          email,
          username: data.user.user_metadata?.username || email.split('@')[0],
          netflixConnected: false,
        };
        setState({ user: u, loading: false, error: null });
      }
      return true;
    } else {
      // Demo mode: match stored user or create
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        const u = JSON.parse(stored) as User;
        if (u.email === email) {
          const netflixAuth = localStorage.getItem(STORAGE_KEYS.NETFLIX_AUTH);
          if (netflixAuth) {
            const na = JSON.parse(netflixAuth);
            u.netflixConnected = na.connected;
            u.netflixProfileName = na.profileName;
          }
          setState({ user: u, loading: false, error: null });
          return true;
        }
      }
      setState(s => ({ ...s, loading: false, error: 'Invalid credentials' }));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setState({ user: null, loading: false, error: null });
  }, []);

  const updateNetflixStatus = useCallback((connected: boolean, profileName?: string) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updated: User = {
        ...prev.user,
        netflixConnected: connected,
        netflixProfileName: profileName,
        netflixConnectedAt: connected ? new Date().toISOString() : undefined,
      };
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        const u = JSON.parse(stored) as User;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...u, ...updated }));
      }
      const netflixAuth = {
        connected,
        profileName,
        connectedAt: connected ? new Date().toISOString() : undefined,
      };
      localStorage.setItem(STORAGE_KEYS.NETFLIX_AUTH, JSON.stringify(netflixAuth));
      return { ...prev, user: updated };
    });
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
    updateNetflixStatus,
  };
}
