# WatchParty – Watch Together, Stay Connected

A HEARO-style watch party app with **synced playback**, **live chat**, and **voice chat**. Create parties, share a code, and watch together in real time.

## Features

- **Simple sign-in**: Magic link, Google OAuth, or email/password
- **Create & join parties**: 3-step wizard, join by 6-character code
- **Synced video**: HLS support, shared playback controls
- **Live chat**: Real-time messages via Supabase Realtime
- **Voice chat**: WebRTC-based voice (requires Supabase for signaling)
- **Demo mode**: Works without Supabase for testing the UI

## Quick Start

```sh
npm install
npm run dev
```

Open http://localhost:8080

## Supabase Setup

For full functionality (auth, real-time chat, voice, persistence):

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/00001_initial_schema.sql` in the SQL Editor
3. Enable Realtime for `party_messages` (Database → Replication)
4. Copy `.env.example` to `.env` and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

See **SUPABASE_SETUP.md** for detailed steps.

---

## How can I edit this code?

There are several ways of editing your application.

**Use OnSpace**

Simply visit the [OnSpace Project]() and start prompting.

Changes made via OnSpace will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in OnSpace.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [OnSpace]() and click on Share -> Publish.
