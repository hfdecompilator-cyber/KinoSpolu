export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  code: string;
  host_id: string;
  host_name: string;
  description?: string;
  media_url?: string;
  media_title?: string;
  media_type: 'video' | 'music' | 'screen';
  thumbnail?: string;
  max_members: number;
  current_members: number;
  is_private: boolean;
  is_live: boolean;
  genre?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  party_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  created_at: string;
}

export interface VoiceMember {
  id: string;
  username: string;
  avatar_url?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isDeafened: boolean;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface PartyMember {
  id: string;
  user_id: string;
  party_id: string;
  username: string;
  avatar_url?: string;
  role: 'host' | 'member';
  joined_at: string;
}
