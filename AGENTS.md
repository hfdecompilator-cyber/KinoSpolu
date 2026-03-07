# AGENTS.md

## Cursor Cloud specific instructions

### Overview

StreamHub (KinoPulse) is a single-page React + TypeScript watch party app built with Vite, Tailwind CSS, and shadcn/ui. There is no backend server — the app runs entirely client-side with mock auth via localStorage. Supabase integration is optional and only activates when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars are set.

### Development commands

See `package.json` scripts. Key commands:

- `npm run dev` — starts Vite dev server on port **8080** (not the default 5173)
- `npm run build` — production build
- `npm run lint` — ESLint (has 1 pre-existing error in `tailwind.config.ts` re: `require()` import)

### Caveats

- The app uses hash-based routing (`/#/services`, `/#/lobby`, `/#/settings`, etc.). The main entry point is `/#/services`.
- Guest authentication activates automatically when a user initiates room creation — no manual sign-up/login form is needed for testing.
- Clicking a streaming service button (e.g., Netflix "N") may open that service's OAuth page in a new tab. This is expected; the app continues in the original tab with auto-login guest mode.
- State persists in localStorage. To reset the app to a fresh state, clear localStorage for `localhost:8080`.
