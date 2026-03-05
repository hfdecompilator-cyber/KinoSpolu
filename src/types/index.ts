export interface User {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  netflixConnected: boolean;
  netflixConnectedAt?: string;
  netflixProfileName?: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostUsername: string;
  service: 'netflix';
  contentTitle?: string;
  contentUrl?: string;
  maxParticipants: number;
  isPrivate: boolean;
  status: 'waiting' | 'watching' | 'paused' | 'ended';
  createdAt: string;
  participants?: RoomParticipant[];
}

export interface RoomParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  joinedAt: string;
  isHost: boolean;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

export interface NetflixAuthState {
  connected: boolean;
  profileName?: string;
  connectedAt?: string;
}
