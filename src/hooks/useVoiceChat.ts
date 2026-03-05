import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ParticipantVoiceState } from '@/types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

interface PeerConnection {
  userId: string;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
}

export function useVoiceChat(
  partyId: string | undefined,
  currentUserId: string | undefined,
  currentUsername: string | undefined
) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<ParticipantVoiceState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'voice-signal',
          payload: {
            type: 'ice-candidate',
            from_user_id: currentUserId,
            to_user_id: targetUserId,
            payload: event.candidate,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      let audio = audioRefs.current.get(targetUserId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioRefs.current.set(targetUserId, audio);
      }
      audio.srcObject = stream;

      setParticipants(prev =>
        prev.map(p =>
          p.user_id === targetUserId ? { ...p, is_speaking: false } : p
        )
      );
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    const peer: PeerConnection = { userId: targetUserId, pc, stream: null };
    peersRef.current.set(targetUserId, peer);
    return pc;
  }, [currentUserId]);

  const joinVoiceChat = useCallback(async () => {
    if (!partyId || !currentUserId || !currentUsername) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
        video: false,
      });
      localStreamRef.current = stream;

      const channel = supabase.channel(`voice:${partyId}`, {
        config: { broadcast: { self: false } },
      });

      channel.on('broadcast', { event: 'voice-signal' }, async ({ payload }) => {
        if (payload.to_user_id && payload.to_user_id !== currentUserId) return;

        const { type, from_user_id } = payload;

        if (type === 'user-joined') {
          if (from_user_id === currentUserId) return;
          setParticipants(prev => {
            const exists = prev.find(p => p.user_id === from_user_id);
            if (exists) return prev;
            return [...prev, {
              user_id: from_user_id,
              username: payload.payload.username || 'Unknown',
              avatar_url: payload.payload.avatar_url || null,
              is_speaking: false,
              is_muted: false,
            }];
          });

          // Initiate offer to new user
          const pc = createPeerConnection(from_user_id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: 'broadcast',
            event: 'voice-signal',
            payload: {
              type: 'offer',
              from_user_id: currentUserId,
              to_user_id: from_user_id,
              payload: offer,
            },
          });
        } else if (type === 'offer') {
          let peer = peersRef.current.get(from_user_id);
          if (!peer) {
            createPeerConnection(from_user_id);
            peer = peersRef.current.get(from_user_id)!;
          }
          await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.payload as RTCSessionDescriptionInit));
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          channel.send({
            type: 'broadcast',
            event: 'voice-signal',
            payload: {
              type: 'answer',
              from_user_id: currentUserId,
              to_user_id: from_user_id,
              payload: answer,
            },
          });
        } else if (type === 'answer') {
          const peer = peersRef.current.get(from_user_id);
          if (peer) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.payload as RTCSessionDescriptionInit));
          }
        } else if (type === 'ice-candidate') {
          const peer = peersRef.current.get(from_user_id);
          if (peer) {
            await peer.pc.addIceCandidate(new RTCIceCandidate(payload.payload as RTCIceCandidateInit));
          }
        } else if (type === 'user-left') {
          const peer = peersRef.current.get(from_user_id);
          if (peer) {
            peer.pc.close();
            peersRef.current.delete(from_user_id);
          }
          const audio = audioRefs.current.get(from_user_id);
          if (audio) {
            audio.srcObject = null;
            audioRefs.current.delete(from_user_id);
          }
          setParticipants(prev => prev.filter(p => p.user_id !== from_user_id));
        }
      });

      await channel.subscribe();
      channelRef.current = channel;

      // Announce joining
      channel.send({
        type: 'broadcast',
        event: 'voice-signal',
        payload: {
          type: 'user-joined',
          from_user_id: currentUserId,
          payload: { username: currentUsername, avatar_url: null },
        },
      });

      setIsJoined(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join voice chat');
    }
  }, [partyId, currentUserId, currentUsername, createPeerConnection]);

  const leaveVoiceChat = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'voice-signal',
        payload: {
          type: 'user-left',
          from_user_id: currentUserId,
          payload: {},
        },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    peersRef.current.forEach(peer => peer.pc.close());
    peersRef.current.clear();

    audioRefs.current.forEach(audio => { audio.srcObject = null; });
    audioRefs.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    setIsJoined(false);
    setParticipants([]);
  }, [currentUserId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isJoined) leaveVoiceChat();
    };
  }, [isJoined, leaveVoiceChat]);

  return {
    isJoined,
    isMuted,
    participants,
    error,
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
  };
}
