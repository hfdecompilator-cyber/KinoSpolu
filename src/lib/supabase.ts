import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Local storage keys for demo mode (no Supabase)
export const STORAGE_KEYS = {
  USER: 'watchparty_user',
  NETFLIX_AUTH: 'watchparty_netflix_auth',
  ROOMS: 'watchparty_rooms',
  SESSION: 'watchparty_session',
};
