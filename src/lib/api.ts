import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('netflix_session_id');
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

export interface NetflixProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface ContentTitle {
  id: string;
  title: string;
  image: string;
  year?: number;
  rating?: string;
}

export interface ContentCategory {
  category: string;
  titles: ContentTitle[];
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
}

export interface PlaybackState {
  playing: boolean;
  position: number;
  updatedAt: number;
  updatedBy: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface Room {
  code: string;
  hostId: string;
  title: string | null;
  titleImage: string | null;
  service: string;
  createdAt: number;
  participants: Participant[];
  playback: PlaybackState;
  chat: ChatMessage[];
}

export interface RoomSummary {
  code: string;
  title: string | null;
  titleImage: string | null;
  hostName: string;
  participantCount: number;
  createdAt: number;
}

export const netflixApi = {
  async login(email: string, password: string) {
    const { data } = await api.post('/netflix/login', { email, password });
    if (data.sessionId) localStorage.setItem('netflix_session_id', data.sessionId);
    return data;
  },

  async loginDemo() {
    const { data } = await api.post('/netflix/login', { demo: true });
    if (data.sessionId) localStorage.setItem('netflix_session_id', data.sessionId);
    return data;
  },

  async getProfiles(): Promise<{ profiles: NetflixProfile[]; isDemo?: boolean }> {
    const { data } = await api.get('/netflix/profiles');
    return data;
  },

  async selectProfile(profileId: string, profileName: string, profileAvatar: string) {
    const { data } = await api.post('/netflix/select-profile', { profileId, profileName, profileAvatar });
    return data;
  },

  async browse(): Promise<{ content: ContentCategory[]; isDemo?: boolean }> {
    const { data } = await api.get('/netflix/browse');
    return data;
  },

  async getSession() {
    const { data } = await api.get('/netflix/session');
    return data;
  },

  async logout() {
    await api.post('/netflix/logout');
    localStorage.removeItem('netflix_session_id');
  },
};

export const roomApi = {
  async create(title?: string, titleImage?: string): Promise<{ room: Room }> {
    const { data } = await api.post('/rooms', { title, titleImage });
    return data;
  },

  async list(): Promise<{ rooms: RoomSummary[] }> {
    const { data } = await api.get('/rooms');
    return data;
  },

  async get(code: string): Promise<{ room: Room }> {
    const { data } = await api.get(`/rooms/${code}`);
    return data;
  },

  async join(code: string): Promise<{ room: Room }> {
    const { data } = await api.post(`/rooms/${code}/join`);
    return data;
  },

  async leave(code: string) {
    await api.post(`/rooms/${code}/leave`);
  },
};

export class RoomSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  private reconnectTimer: any = null;
  private pingTimer: any = null;

  connect(roomCode: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: 'join_room',
        roomCode,
        sessionId: localStorage.getItem('netflix_session_id'),
      }));
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg);
      } catch {}
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.emit('disconnected', {});
      this.reconnectTimer = setTimeout(() => this.connect(roomCode), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendPlaybackUpdate(state: Partial<PlaybackState>) {
    this.send({ type: 'playback_update', state });
  }

  sendChatMessage(message: string) {
    this.send({ type: 'chat_message', message });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    this.listeners.clear();
    this.ws?.close();
    this.ws = null;
  }
}
