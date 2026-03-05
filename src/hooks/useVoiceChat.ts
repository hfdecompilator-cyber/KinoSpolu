import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type VoiceState = 'disconnected' | 'connecting' | 'connected';

export function useVoiceChat(partyId: string | null, userId: string) {
  const [voiceState, setVoiceState] = useState<VoiceState>('disconnected');
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStreams((prev) => {
      if (prev.some((s) => s.id === stream.id)) return prev;
      return [...prev, stream];
    });
  }, []);

  const joinVoice = useCallback(async () => {
    if (!partyId) return;

    try {
      setVoiceState('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (!isSupabaseConfigured()) {
        setVoiceState('connected');
        addRemoteStream(stream);
        return;
      }

      const channel = supabase.channel(`voice:${partyId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.from === userId) return;
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });

          pc.ontrack = (e) => addRemoteStream(e.streams[0]);
          pc.addTrack(stream.getTracks()[0], stream);

          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { from: userId, to: payload.from, answer },
          });

          peerConnectionsRef.current.set(payload.from, pc);
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const pc = peerConnectionsRef.current.get(payload.from);
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        })
        .on('broadcast', { event: 'ice' }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const pc = peerConnectionsRef.current.get(payload.from);
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const pc = new RTCPeerConnection({
              iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });

            pc.ontrack = (e) => addRemoteStream(e.streams[0]);
            pc.addTrack(stream.getTracks()[0], stream);

            pc.onicecandidate = (e) => {
              if (e.candidate)
                channel.send({
                  type: 'broadcast',
                  event: 'ice',
                  payload: { from: userId, to: 'all', candidate: e.candidate },
                });
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'offer',
              payload: { from: userId, offer },
            });

            peerConnectionsRef.current.set(userId, pc);
            setVoiceState('connected');
          }
        });
    } catch (err) {
      console.error('Voice join error:', err);
      setVoiceState('disconnected');
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    }
  }, [partyId, userId, addRemoteStream]);

  const leaveVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    channelRef.current?.unsubscribe();
    setRemoteStreams([]);
    setVoiceState('disconnected');
  }, []);

  return { voiceState, remoteStreams, joinVoice, leaveVoice };
}
