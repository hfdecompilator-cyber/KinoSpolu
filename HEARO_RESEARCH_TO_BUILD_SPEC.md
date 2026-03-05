# HEARO research to product spec

This document maps HEARO's known watch-party behavior into concrete implementation targets for this app.

## What HEARO is known for

Based on public app/store descriptions and launch materials, HEARO's watch-party experience centers on:

1. Invite-link and room-code watch parties
2. In-app browsing to pick a title before party launch
3. Synchronized playback
4. In-room voice and text communication
5. Cross-device participation
6. Multi-service discovery, with Netflix being a primary use case

## What this project now includes

Implemented in this repository:

- Netflix-auth gated room creation (server-side verification step)
- HEARO-style in-app browser UI for title/video picking before lobby launch
- Room code + invite flow
- Host-controlled synchronized playback state (play/pause/seek)
- Participant presence tracking
- Room chat timeline
- Voice room connection state (UI simulation hook)

## Gap to full HEARO parity

Remaining items for full product parity:

1. Real-time transport (WebSocket/WebRTC) instead of polling
2. True voice/video channels (WebRTC SFU)
3. Production auth identities and persistence
4. Real deep-link launch flows on mobile
5. Multi-service auth adapters beyond Netflix

## Recommended build order

1. Replace room polling with WebSocket events
2. Add persistent storage (Supabase/Postgres)
3. Add WebRTC voice room
4. Add service adapter layer for Disney+, Prime, Hulu, YouTube
5. Ship iOS/Android wrappers with deep-link invite join
