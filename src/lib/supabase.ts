import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase environment variables missing.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See .env.example for reference.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
        };
      };
      parties: {
        Row: {
          id: string;
          name: string;
          host_id: string;
          video_url: string | null;
          video_type: 'youtube' | 'direct' | null;
          party_code: string;
          is_active: boolean;
          is_playing: boolean;
          current_time: number;
          created_at: string;
        };
        Insert: {
          name: string;
          host_id: string;
          video_url?: string | null;
          video_type?: 'youtube' | 'direct' | null;
          party_code: string;
          is_active?: boolean;
          is_playing?: boolean;
          current_time?: number;
        };
        Update: {
          name?: string;
          video_url?: string | null;
          video_type?: 'youtube' | 'direct' | null;
          is_active?: boolean;
          is_playing?: boolean;
          current_time?: number;
        };
      };
      party_members: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          party_id: string;
          user_id: string;
        };
        Update: Record<string, never>;
      };
      chat_messages: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          message: string;
          reaction: string | null;
          created_at: string;
        };
        Insert: {
          party_id: string;
          user_id: string;
          message: string;
          reaction?: string | null;
        };
        Update: {
          reaction?: string | null;
        };
      };
    };
  };
};
