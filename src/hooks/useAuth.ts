import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  displayName: string;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
}

// Fallback user when Supabase not configured (demo mode)
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@watchparty.app',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: '',
  created_at: '',
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      // Demo mode - check localStorage for persisted demo user
      const saved = localStorage.getItem('watchparty-demo-user');
      setUser(saved ? { ...DEMO_USER, ...JSON.parse(saved) } : null);
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [configured]);

  const displayName = 
    user?.user_metadata?.full_name || 
    user?.email?.split('@')[0] || 
    'Anonymous';

  const signInWithMagicLink = async (email: string) => {
    if (!configured) {
      localStorage.setItem('watchparty-demo-user', JSON.stringify({ email }));
      setUser({ ...DEMO_USER, email } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOtp({ 
      email, 
      options: { emailRedirectTo: window.location.origin } 
    });
    return { error };
  };

  const signInWithEmail = signInWithMagicLink; // Magic link is primary

  const signInWithGoogle = async () => {
    if (!configured) {
      setUser({ ...DEMO_USER, email: 'google-demo@watchparty.app' } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!configured) {
      localStorage.setItem('watchparty-demo-user', JSON.stringify({ email }));
      setUser({ ...DEMO_USER, email } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!configured) {
      setUser({ ...DEMO_USER, email } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!configured) {
      localStorage.removeItem('watchparty-demo-user');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    displayName,
    isLoading,
    isConfigured: configured,
    signInWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    signUpWithEmail,
    signInWithPassword,
  };
}
