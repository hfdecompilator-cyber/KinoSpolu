# Legal access-gated room example

This repository now includes a HEARO-style watch-party baseline with legal access gating:

1. Host must verify access for the selected streaming service.
2. Guests must verify access for the room's required service before joining.
3. Room join is rejected unless each participant has a valid service access token.
4. The app syncs room state only (playback, chat, participants); it does not restream media.

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
4. Choose a service, verify host access, and create room.
5. Load room code on another client, verify guest access, then join.

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
