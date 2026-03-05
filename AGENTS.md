## Cursor Cloud specific instructions

This is a **frontend-only** Vite + React + TypeScript + Tailwind CSS + shadcn/ui project (WatchParty / StreamHub). There is no backend server, Docker, or database to run locally.

### Important: Missing source code

The `src/` directory was **never committed** to the repository. Only config files, lock files, and documentation exist in git history. Minimal scaffolding files (`src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/vite-env.d.ts`) were created during environment setup so the dev server can start. If the original source is ever committed, those scaffolding files should be replaced.

### Dev commands

All standard commands are in `package.json`:

- **Dev server:** `npm run dev` — starts Vite on `http://localhost:8080` (configured in `vite.config.ts`)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Preview:** `npm run preview`

### Gotchas

- `tailwind.config.ts` has a pre-existing lint error (`@typescript-eslint/no-require-imports` for `require('tailwindcss-animate')`). This is in the original repo code and is not a setup issue.
- Both `package-lock.json` and `bun.lock` exist. Use **npm** as the primary package manager (matches README instructions and `package-lock.json`).
- The project uses shadcn/ui with `components.json` configured. The `@` path alias maps to `./src/*` (see `tsconfig.json` and `vite.config.ts`).
- External services (Supabase, Stripe, Google AI) are optional dependencies listed in `package.json` but are not required for local development — the app works with mock data.
