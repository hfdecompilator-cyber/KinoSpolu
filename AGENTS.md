## Cursor Cloud specific instructions

This is **GlassSync** — a frosted-glass watch party web app. Frontend-only (React + Vite + Tailwind), no Docker or external services needed to run locally.

### Architecture

- **Dual-mode backend**: `src/lib/supabase.ts` auto-detects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. When set, uses Supabase for auth and data. When absent, falls back to localStorage — app works fully either way.
- **State**: Zustand store in `src/stores/store.ts` handles auth, lobbies, chat, service connections.
- **Auth**: Password-based signup/signin. When Supabase is configured, uses `supabase.auth`. Otherwise localStorage.
- **Services**: Users connect streaming services (YouTube, Netflix, Disney+, etc.) on their profile. Room creation requires the service to be connected. Joining requires matching service.
- **Lobbies**: Private (invite-code only) or public. 6-char uppercase codes.
- **YouTube**: Paste any YouTube URL → video ID extracted → embedded via iframe API.

### Dev commands

- `npm run dev` — Vite on `http://localhost:8080`
- `npm run build` — production build
- `npm run lint` — ESLint

### Supabase setup (optional)

To enable Supabase backend, create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Tables needed: `lobbies`, `messages`, `profiles`. The app currently uses localStorage as the data layer; Supabase integration adds real-time sync and persistent multi-device auth.

### Gotchas

- `tailwind.config.ts` has a pre-existing lint error (`require()` import). Not a setup issue.
- Both `package-lock.json` and `bun.lock` exist. Use **npm**.
- `@` path alias maps to `./src/*`.
