# AGENTS.md

## Cursor Cloud specific instructions

This is a React + TypeScript + Vite frontend SPA (KinoPulse / StreamHub watch party platform). No backend server is required — the app runs in local/fallback mode using `localStorage` when Supabase env vars are absent.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server | `npm run dev` | 8080 | The only required service |

### Key commands

Standard commands are in `package.json` scripts — see `README.md` for setup steps. Quick reference:

- **Dev server**: `npm run dev` (port 8080)
- **Lint**: `npm run lint`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

### Non-obvious notes

- The app uses **mock authentication** (auto-generates a Guest user with localStorage). No login credentials are needed.
- Supabase is optional: env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` enable real-time sync, but the app runs fully standalone without them.
- There is 1 pre-existing lint error in `tailwind.config.ts` (`@typescript-eslint/no-require-imports` on a `require()` call). This is not a blocker.
- The `bun.lock` file exists alongside `package-lock.json`, but the project uses **npm** (matches the lockfile and README instructions).
- Android/Capacitor scripts (`cap:sync`, `android:*`) are only relevant for mobile APK builds, not web development.
