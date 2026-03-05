export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      parties: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          host_id: string;
          video_url: string | null;
          video_title: string | null;
          video_source: string | null;
          playback_position: number;
          is_playing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          host_id: string;
          video_url?: string | null;
          video_title?: string | null;
          video_source?: string | null;
          playback_position?: number;
          is_playing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          host_id?: string;
          video_url?: string | null;
          video_title?: string | null;
          video_source?: string | null;
          playback_position?: number;
          is_playing?: boolean;
          updated_at?: string;
        };
      };
      party_messages: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          user_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          user_id: string;
          user_name: string;
          content: string;
          created_at?: string;
        };
      };
      party_members: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          user_name: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          user_id: string;
          user_name: string;
          joined_at?: string;
        };
      };
    };
  };
}

export type Party = Database['public']['Tables']['parties']['Row'];
export type PartyMessage = Database['public']['Tables']['party_messages']['Row'];
export type PartyMember = Database['public']['Tables']['party_members']['Row'];
