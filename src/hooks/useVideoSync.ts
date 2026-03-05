import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoSyncEvent } from '@/types';

interface UseVideoSyncOptions {
  partyId: string | undefined;
  isHost: boolean;
  currentUserId: string | undefined;
  onSync: (event: VideoSyncEvent) => void;
}

export function useVideoSync({ partyId, isHost, currentUserId, onSync }: UseVideoSyncOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  useEffect(() => {
    if (!partyId) return;

    const channel = supabase.channel(`video-sync:${partyId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'video-sync' }, ({ payload }) => {
      if (payload.host_id !== currentUserId) {
        onSync(payload as VideoSyncEvent);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [partyId, currentUserId, onSync]);

  const broadcastVideoState = useCallback((
    isPlaying: boolean,
    currentTime: number
  ) => {
    if (!isHost || !channelRef.current || !currentUserId) return;

    const now = Date.now();
    if (now - lastBroadcastRef.current < 100) return;
    lastBroadcastRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'video-sync',
      payload: {
        type: isPlaying ? 'play' : 'pause',
        current_time: currentTime,
        is_playing: isPlaying,
        host_id: currentUserId,
      } as VideoSyncEvent,
    });
  }, [isHost, currentUserId]);

  const broadcastSeek = useCallback((currentTime: number, isPlaying: boolean) => {
    if (!isHost || !channelRef.current || !currentUserId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'video-sync',
      payload: {
        type: 'seek',
        current_time: currentTime,
        is_playing: isPlaying,
        host_id: currentUserId,
      } as VideoSyncEvent,
    });
  }, [isHost, currentUserId]);

  const requestSync = useCallback(() => {
    if (!channelRef.current || !currentUserId || isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'video-sync',
      payload: {
        type: 'sync',
        current_time: 0,
        is_playing: false,
        host_id: currentUserId,
      },
    });
  }, [currentUserId, isHost]);

  return { broadcastVideoState, broadcastSeek, requestSync };
}
