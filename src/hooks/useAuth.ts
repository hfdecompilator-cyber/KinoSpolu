import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data as Profile | null;
  }, []);

  const createProfile = useCallback(async (userId: string, email: string, name?: string) => {
    const username = name || email.split('@')[0];
    const { data } = await supabase
      .from('profiles')
      .upsert({ id: userId, username, avatar_url: null })
      .select()
      .single();
    return data as Profile | null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile: profile || await createProfile(session.user.id, session.user.email || ''),
          session,
          loading: false,
        });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          const finalProfile = profile || await createProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name || session.user.user_metadata?.name
          );
          setState({
            user: session.user,
            profile: finalProfile,
            session,
            loading: false,
          });
        } else {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, createProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: username } },
    });
    if (!error && data.user) {
      await createProfile(data.user.id, email, username);
    }
    return { data, error };
  }, [createProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!state.user) return { error: new Error('Not authenticated') as AuthError };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();
    if (!error && data) {
      setState(prev => ({ ...prev, profile: data as Profile }));
    }
    return { data, error };
  }, [state.user]);

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
  };
}
