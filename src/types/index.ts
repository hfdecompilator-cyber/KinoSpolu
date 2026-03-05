export type StreamingService =
  | 'netflix'
  | 'youtube'
  | 'spotify'
  | 'twitch'
  | 'prime'
  | 'disney'
  | 'hbo'
  | 'apple'
  | 'hulu'
  | 'paramount';

export interface ServiceAuth {
  service: StreamingService;
  connected: boolean;
  connectedAt: string | null;
  username: string | null;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
  connectedServices: ServiceAuth[];
  friends: string[];
  partiesHosted: number;
  partiesJoined: number;
}

export interface PartyMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  isHost: boolean;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  partyId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  type: 'text' | 'system' | 'emoji';
  createdAt: string;
}

export type PartyStatus = 'waiting' | 'watching' | 'paused' | 'ended';
export type PartyVisibility = 'public' | 'private';

export interface Party {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostUsername: string;
  hostDisplayName: string;
  service: StreamingService;
  contentTitle: string;
  contentUrl: string;
  visibility: PartyVisibility;
  status: PartyStatus;
  maxMembers: number;
  members: PartyMember[];
  messages: ChatMessage[];
  inviteCode: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  tags: string[];
  thumbnailUrl: string;
}

export interface CreatePartyInput {
  name: string;
  description: string;
  service: StreamingService;
  contentTitle: string;
  contentUrl: string;
  visibility: PartyVisibility;
  maxMembers: number;
  tags: string[];
}
