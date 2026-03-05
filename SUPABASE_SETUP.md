# Supabase Setup for WatchParty

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be provisioned

## 2. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query and paste the contents of `supabase/migrations/00001_initial_schema.sql`
3. Run the query

## 3. Enable Realtime for Chat

1. Go to **Database** → **Replication**
2. Find the `party_messages` table
3. Toggle **ON** to enable real-time subscriptions for chat

## 4. Enable Google OAuth (Optional)

For "Sign in with Google":

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials (from Google Cloud Console)

## 5. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. In Supabase: **Settings** → **API** → copy your URL and anon key
3. Set in `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

## 6. Configure Auth URL (for Magic Link & OAuth)

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL (e.g. `http://localhost:8080` for dev)
3. Add redirect URLs for OAuth callbacks

## Demo Mode

Without Supabase configured, the app runs in **demo mode**:
- Sign in works locally (no persistence)
- Parties are stored in memory (restart loses them)
- Chat works locally per party
- Create a party, share the code, open another tab and join with the same code to test
