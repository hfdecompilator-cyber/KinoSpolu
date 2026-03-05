# WatchParty (HEARO-style) with Supabase + Voice Chat

This project now includes:

- Easy sign in (email/password, Google OAuth, magic link)
- Easy sign in (auto sign-in or register from one form)
- Watch party create/join by code
- Synced playback events in live mode
- Live chat in each room
- Built-in voice chat room (Jitsi)
- Demo mode fallback when Supabase keys are missing
- Session persistence across app restart (Supabase and guest mode)

## Quick setup

1. Install dependencies

`npm install`

2. Add env vars

`cp .env.example .env`

Update `.env` with your Supabase project URL + anon key.

3. Create Supabase tables and policies

Run `supabase/schema.sql` in the Supabase SQL editor.

4. Start app

`npm run dev`

## Live mode requirements

- Supabase Auth enabled (email/password and optional Google provider)
- RLS policies from `supabase/schema.sql`
- Realtime enabled for `chat_messages` and `playback_events`

If env vars are missing, app still works in local demo mode for quick testing.
