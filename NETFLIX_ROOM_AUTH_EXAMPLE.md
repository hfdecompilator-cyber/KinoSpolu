# Legal access-gated room example

This repository now includes a HEARO-style watch-party baseline with legal access gating:

1. Host must verify access for the selected streaming service.
2. Host must pick a movie/show/video in the in-app browser before lobby creation.
3. Guests must verify access for the room's required service before joining.
4. Room join is rejected unless each participant has a valid service access token.
5. The app syncs room state only (playback, chat, participants); it does not restream media.

## CZ/SK market support

Service catalog now includes local platforms in addition to global services:

- Voyo
- iVysilani
- RTVS archive
- Prima+
- O2 TV
- Skylink Live TV

The UI marks CZ/SK-ready services and supports affiliate-ready signup links in join flow.

## Injectable wrapper bridge

The in-app browser now includes a copyable JavaScript bridge that is meant to run inside a mobile WebView wrapper.
It hooks HTML5 video events and accepts remote play/pause/seek commands without handling media bytes directly.
See `CUSTOM_WEB_WRAPPERS.md` for implementation details.

For Netflix, verification checks a real session against `https://www.netflix.com/browse`.
For non-Netflix services, this example records participant attestation + account reference (upgrade to OAuth/provider entitlement checks in production).

## Run it

1. Start API server:

```bash
npm run api
```

2. In a second terminal, start frontend:

```bash
npm run dev
```

3. Open `http://localhost:8080`.
4. Choose a service, verify host access, pick content in the in-app browser, and create lobby.
5. Load room code on another client, verify guest access, then join the lobby.

### Optional local Netflix success simulation (for CI/dev testing)

By default, Netflix verification calls real Netflix browse.  
If you need deterministic tests without real cookies, set `NETFLIX_BROWSE_URL` to a local stub endpoint.

## API routes

- `GET /api/services`
- `POST /api/access/verify`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `POST /api/rooms/:code/join`
- `POST /api/rooms/:code/playback`
- `POST /api/rooms/:code/messages`
- `GET /api/health`

## Security notes

- Tokens are short-lived (30 minutes) and stored in memory in this example.
- Do not log raw Netflix cookies.
- For production, store verification state in a database and add rate limiting.

## Monetization-safe zones

- Ads are rendered only in social UI areas (lobby/chat/panels), never injected into provider video playback.
- Room tier supports free/premium participant caps (free 3, premium 10) as a freemium baseline.
