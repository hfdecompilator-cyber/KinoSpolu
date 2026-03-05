-- ============================================================
-- WatchParty App - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with display info
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTIES TABLE
-- Watch party rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT,
  video_type TEXT CHECK (video_type IN ('youtube', 'direct', NULL)),
  party_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_playing BOOLEAN DEFAULT FALSE,
  current_time FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active parties are viewable by everyone"
  ON public.parties FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create parties"
  ON public.parties FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their parties"
  ON public.parties FOR UPDATE USING (auth.uid() = host_id);

-- ============================================================
-- PARTY MEMBERS TABLE
-- Users who have joined a party
-- ============================================================
CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members are viewable by authenticated users"
  ON public.party_members FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join parties"
  ON public.party_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave parties"
  ON public.party_members FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CHAT MESSAGES TABLE
-- Real-time chat messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  reaction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages are viewable by authenticated users"
  ON public.chat_messages FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can send messages"
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reactions on messages"
  ON public.chat_messages FOR UPDATE USING (true);

-- ============================================================
-- ENABLE REALTIME
-- Required for live chat and party sync features
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ============================================================
-- INDEXES for better performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_parties_party_code ON public.parties(party_code);
CREATE INDEX IF NOT EXISTS idx_parties_host_id ON public.parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_is_active ON public.parties(is_active);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON public.party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_user_id ON public.party_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_party_id ON public.chat_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
