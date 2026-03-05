import { create } from 'zustand';
import { roomApi, RoomSocket, type Room, type ChatMessage, type PlaybackState } from '@/lib/api';

interface RoomState {
  currentRoom: Room | null;
  socket: RoomSocket | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  createRoom: (title?: string, titleImage?: string) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  connectSocket: (code: string) => void;
  fetchRoom: (code: string) => Promise<boolean>;
  updatePlayback: (state: Partial<PlaybackState>) => void;
  sendChat: (message: string) => void;
  clearError: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  socket: null,
  isConnected: false,
  isLoading: false,
  error: null,

  createRoom: async (title, titleImage) => {
    set({ isLoading: true, error: null });
    try {
      const { room } = await roomApi.create(title, titleImage);
      set({ currentRoom: room, isLoading: false });
      return room.code;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create room.', isLoading: false });
      return null;
    }
  },

  joinRoom: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const { room } = await roomApi.join(code.toUpperCase());
      set({ currentRoom: room, isLoading: false });
      get().connectSocket(room.code);
      return true;
    } catch (err: any) {
      // If already a participant, try fetching the room instead
      if (err.response?.status === 400 || err.response?.status === 409) {
        return get().fetchRoom(code);
      }
      set({ error: err.response?.data?.error || 'Failed to join room.', isLoading: false });
      return false;
    }
  },

  fetchRoom: async (code) => {
    try {
      const { room } = await roomApi.get(code.toUpperCase());
      set({ currentRoom: room, isLoading: false });
      get().connectSocket(room.code);
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  leaveRoom: async () => {
    const { currentRoom, socket } = get();
    if (currentRoom) {
      try { await roomApi.leave(currentRoom.code); } catch {}
    }
    socket?.disconnect();
    set({ currentRoom: null, socket: null, isConnected: false });
  },

  connectSocket: (code) => {
    const oldSocket = get().socket;
    if (oldSocket) oldSocket.disconnect();

    const socket = new RoomSocket();

    socket.on('room_state', (msg) => {
      set({ currentRoom: msg.room, isConnected: true });
    });

    socket.on('user_joined', (msg) => {
      set((state) => {
        if (!state.currentRoom) return state;
        const exists = state.currentRoom.participants.some(p => p.id === msg.user.id);
        if (exists) return state;
        return {
          currentRoom: {
            ...state.currentRoom,
            participants: [...state.currentRoom.participants, {
              ...msg.user,
              isHost: false,
              joinedAt: Date.now(),
              avatar: '',
            }],
          },
        };
      });
    });

    socket.on('user_left', (msg) => {
      set((state) => {
        if (!state.currentRoom) return state;
        return {
          currentRoom: {
            ...state.currentRoom,
            participants: state.currentRoom.participants.filter(p => p.id !== msg.userId),
          },
        };
      });
    });

    socket.on('playback_sync', (msg) => {
      set((state) => {
        if (!state.currentRoom) return state;
        return {
          currentRoom: { ...state.currentRoom, playback: msg.state },
        };
      });
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      set((state) => {
        if (!state.currentRoom) return state;
        return {
          currentRoom: {
            ...state.currentRoom,
            chat: [...state.currentRoom.chat, msg],
          },
        };
      });
    });

    socket.on('disconnected', () => {
      set({ isConnected: false });
    });

    socket.connect(code);
    set({ socket });
  },

  updatePlayback: (state) => {
    get().socket?.sendPlaybackUpdate(state);
    set((s) => {
      if (!s.currentRoom) return s;
      return {
        currentRoom: {
          ...s.currentRoom,
          playback: { ...s.currentRoom.playback, ...state, updatedAt: Date.now() },
        },
      };
    });
  },

  sendChat: (message) => {
    get().socket?.sendChatMessage(message);
  },

  clearError: () => set({ error: null }),
}));
