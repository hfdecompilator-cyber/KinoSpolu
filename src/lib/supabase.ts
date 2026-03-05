import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client - works even without credentials (for graceful degradation)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'watchparty-auth',
    flowType: 'pkce',
  },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () =>
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your') &&
  supabaseUrl.startsWith('https://');
