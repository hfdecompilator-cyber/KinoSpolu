import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, STORAGE_KEYS } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/utils';
import type { Room, RoomParticipant } from '@/types';

export function useRoom(userId: string | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocalRooms = (): Room[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return stored ? JSON.parse(stored) : [];
  };

  const saveLocalRooms = (r: Room[]) => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(r));
  };

  const loadRooms = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase && userId) {
      const { data, error: err } = await supabase
        .from('rooms')
        .select('*, room_participants(*)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (err) {
        setError(err.message);
      } else {
        setRooms((data as Room[]) || []);
      }
    } else {
      const local = getLocalRooms();
      setRooms(local);
    }
    setLoading(false);
  }, [userId]);

  const createRoom = useCallback(
    async (params: {
      name: string;
      contentTitle: string;
      contentUrl: string;
      maxParticipants: number;
      isPrivate: boolean;
      username: string;
    }): Promise<Room | null> => {
      if (!userId) return null;
      setLoading(true);
      setError(null);

      const code = generateRoomCode();
      const now = new Date().toISOString();
      const hostParticipant: RoomParticipant = {
        userId,
        username: params.username,
        joinedAt: now,
        isHost: true,
        isReady: true,
      };

      const newRoom: Room = {
        id: Math.random().toString(36).substring(2),
        code,
        name: params.name,
        hostId: userId,
        hostUsername: params.username,
        service: 'netflix',
        contentTitle: params.contentTitle,
        contentUrl: params.contentUrl,
        maxParticipants: params.maxParticipants,
        isPrivate: params.isPrivate,
        status: 'waiting',
        createdAt: now,
        participants: [hostParticipant],
      };

      if (isSupabaseConfigured && supabase) {
        const { data, error: err } = await supabase
          .from('rooms')
          .insert({
            code,
            name: params.name,
            host_id: userId,
            service: 'netflix',
            content_title: params.contentTitle,
            content_url: params.contentUrl,
            max_participants: params.maxParticipants,
            is_private: params.isPrivate,
            status: 'waiting',
          })
          .select()
          .single();
        if (err) {
          setError(err.message);
          setLoading(false);
          return null;
        }
        setLoading(false);
        return data as Room;
      } else {
        const local = getLocalRooms();
        const updated = [newRoom, ...local];
        saveLocalRooms(updated);
        setRooms(updated);
        setLoading(false);
        return newRoom;
      }
    },
    [userId]
  );

  const joinRoom = useCallback(
    async (code: string, username: string): Promise<Room | null> => {
      if (!userId) return null;
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured && supabase) {
        const { data, error: err } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', code.toUpperCase())
          .single();
        if (err || !data) {
          setError('Room not found');
          setLoading(false);
          return null;
        }
        setLoading(false);
        return data as Room;
      } else {
        const local = getLocalRooms();
        const room = local.find(r => r.code === code.toUpperCase());
        if (!room) {
          setError('Room not found. Check the code and try again.');
          setLoading(false);
          return null;
        }
        const alreadyIn = room.participants?.some(p => p.userId === userId);
        if (!alreadyIn) {
          const participant: RoomParticipant = {
            userId,
            username,
            joinedAt: new Date().toISOString(),
            isHost: false,
            isReady: false,
          };
          room.participants = [...(room.participants || []), participant];
          saveLocalRooms(local);
        }
        setLoading(false);
        return room;
      }
    },
    [userId]
  );

  return { rooms, loading, error, loadRooms, createRoom, joinRoom };
}
