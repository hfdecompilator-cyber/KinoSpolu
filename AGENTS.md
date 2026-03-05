## Cursor Cloud specific instructions

This is a **frontend-only** Vite + React + TypeScript + Tailwind CSS + shadcn/ui project (WatchParty / StreamHub). There is no backend server, Docker, or database to run locally.

### Dev commands

All standard commands are in `package.json`:

- **Dev server:** `npm run dev` — starts Vite on `http://localhost:8080` (configured in `vite.config.ts`)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Preview:** `npm run preview`

### Architecture

- **State management:** Zustand stores in `src/stores/` (auth, parties)
- **Persistence:** localStorage-based database layer in `src/lib/database.ts` — structured to mirror Supabase's API patterns for future migration
- **Demo data:** `src/lib/seed.ts` seeds demo users/parties on first load (keyed by `wp_seeded_v2` in localStorage)
- **Auth:** Local auth with signup/login, service connections stored per-user
- **Core feature:** Public lobbies are filtered by shared streaming service authentication — users can only join parties for services they have connected

### Gotchas

- `tailwind.config.ts` has a pre-existing lint error (`@typescript-eslint/no-require-imports` for `require('tailwindcss-animate')`). This is in the original repo code and is not a setup issue.
- Both `package-lock.json` and `bun.lock` exist. Use **npm** as the primary package manager (matches README instructions and `package-lock.json`).
- The project uses shadcn/ui with `components.json` configured. The `@` path alias maps to `./src/*` (see `tsconfig.json` and `vite.config.ts`).
- External services (Supabase, Stripe, Google AI) are optional dependencies listed in `package.json` but are not required for local development — the app works with localStorage persistence.
- To reset demo data, clear `wp_seeded_v2` from localStorage (or clear all localStorage for the site).
