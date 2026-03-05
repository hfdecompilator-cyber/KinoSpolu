export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Party {
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
  host?: Profile;
  member_count?: number;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface ChatMessage {
  id: string;
  party_id: string;
  user_id: string;
  message: string;
  reaction: string | null;
  created_at: string;
  profile?: Profile;
}

export interface VideoSyncEvent {
  type: 'play' | 'pause' | 'seek' | 'sync';
  current_time: number;
  is_playing: boolean;
  host_id: string;
}

export interface VoiceSignalEvent {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  from_user_id: string;
  to_user_id?: string;
  payload: unknown;
}

export interface ParticipantVoiceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_speaking: boolean;
  is_muted: boolean;
}
