# CZ/SK watch-party stack (BYOS legal model)

This stack keeps the product in a Hearo-style legal lane: synchronize controls + social presence, never restream protected video.

## Client applications

- Mobile: React Native or Flutter with native WebView wrapper
- Web/Desktop: React + TypeScript
- Embedded browser mode for provider playback (Netflix/Voyo/etc.) with no DRM bypass

## Real-time sync layer

- Signaling + state sync: WebSocket gateway (Socket.IO or native ws)
- Presence model: room membership, host role, heartbeat, reconnect
- Playback packets: play/pause/seek/timecode with monotonic sequence numbers

## Voice chat

- WebRTC for media transport
- SFU recommended (LiveKit/Janus/mediasoup) for room scale
- Separate voice consent flow (GDPR)

## Backend services

- API: Node.js/TypeScript (Fastify/Express) or Go
- DB: Postgres (rooms, membership, audit logs, feature flags)
- Cache/session: Redis (presence, short-lived access tokens, rate limits)

## Compliance and policy guardrails

- BYOS gate: each participant verifies service access before join
- No video proxying, no media recording, no DRM circumvention
- GDPR: consent capture, data retention policy, export/delete endpoints
- Moderation: abuse report endpoints, room kick/ban controls

## Monetization-safe architecture

- Free tier: small room limits + social-surface ads
- Premium tier: larger room capacity, higher-quality voice, custom cosmetics
- Affiliate links in pre-lobby/join panel for missing subscriptions
- Keep ads outside provider playback surface
