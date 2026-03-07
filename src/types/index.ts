export type Service = 'youtube' | 'netflix' | 'disney' | 'prime' | 'hbo' | 'spotify' | 'twitch' | 'hulu' | 'apple' | 'paramount';

export const ALL_SERVICES: { id: Service; name: string; icon: string }[] = [
  { id: 'youtube', name: 'YouTube', icon: '▶' },
  { id: 'netflix', name: 'Netflix', icon: '🎬' },
  { id: 'disney', name: 'Disney+', icon: '🏰' },
  { id: 'prime', name: 'Prime Video', icon: '📦' },
  { id: 'hbo', name: 'Max', icon: '🎭' },
  { id: 'spotify', name: 'Spotify', icon: '🎵' },
  { id: 'twitch', name: 'Twitch', icon: '🎮' },
  { id: 'hulu', name: 'Hulu', icon: '📺' },
  { id: 'apple', name: 'Apple TV+', icon: '🍎' },
  { id: 'paramount', name: 'Paramount+', icon: '⭐' },
];

export const svcInfo = (id: Service) => ALL_SERVICES.find((s) => s.id === id) || ALL_SERVICES[0];

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  connectedServices: Service[];
  createdAt: string;
}

export interface Lobby {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  title: string;
  videoUrl: string;
  videoId: string;
  service: Service;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  visibility: 'private' | 'public';
  members: LobbyMember[];
  messages: ChatMsg[];
  maxMembers: number;
  createdAt: string;
}

export interface LobbyMember {
  userId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: string;
}

export interface ChatMsg {
  id: string;
  lobbyId: string;
  userId: string;
  name: string;
  text: string;
  ts: string;
  type: 'user' | 'system';
}
