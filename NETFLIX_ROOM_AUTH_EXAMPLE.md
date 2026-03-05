# Netflix-authenticated room creation example

This repository now includes a working example where room creation is blocked until a Netflix session is verified server-side.

## Why this approach

Netflix does not provide a public OAuth API for third-party room apps, so this example uses a session-proof flow:

1. User signs in to Netflix in their browser.
2. User provides `NetflixId` + `SecureNetflixId` cookie values.
3. Backend validates those cookies against `https://www.netflix.com/browse`.
4. Backend issues a short-lived verification token.
5. Room creation requires that token.

This is much closer to a real HEARO-style gate than mock localStorage auth.

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
4. Verify Netflix session.
5. Create room.

### Optional local success simulation (for CI/dev testing)

By default, verification calls real Netflix browse.  
If you need deterministic tests without real cookies, set `NETFLIX_BROWSE_URL` to a local stub endpoint.

## API routes

- `POST /api/netflix/verify-session`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `GET /api/health`

## Security notes

- Tokens are short-lived (10 minutes) and stored in memory in this example.
- Do not log raw Netflix cookies.
- For production, store verification state in a database and add rate limiting.
