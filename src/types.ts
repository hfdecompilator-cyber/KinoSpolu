export type AppMode = "live" | "demo";

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface Party {
  code: string;
  title: string;
  videoUrl: string;
  hostUserId: string;
  hostName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  partyCode: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export type PlaybackAction = "play" | "pause" | "seek";
