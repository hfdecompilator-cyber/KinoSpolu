-- WatchParty Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Parties table
create table if not exists public.parties (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text not null,
  description text,
  host_id uuid not null,
  video_url text,
  video_title text,
  video_source text,
  playback_position numeric default 0,
  is_playing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Party members (participants)
create table if not exists public.party_members (
  id uuid default uuid_generate_v4() primary key,
  party_id uuid references public.parties(id) on delete cascade not null,
  user_id uuid not null,
  user_name text not null,
  joined_at timestamptz default now(),
  unique(party_id, user_id)
);

-- Party chat messages
create table if not exists public.party_messages (
  id uuid default uuid_generate_v4() primary key,
  party_id uuid references public.parties(id) on delete cascade not null,
  user_id uuid not null,
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_messages enable row level security;
alter table public.profiles enable row level security;

-- Policies: Anyone can read parties by code
create policy "Parties are viewable by code" on public.parties
  for select using (true);

create policy "Users can create parties" on public.parties
  for insert with check (auth.uid() = host_id);

create policy "Host can update own party" on public.parties
  for update using (auth.uid() = host_id);

create policy "Host can delete own party" on public.parties
  for delete using (auth.uid() = host_id);

-- Party members: join/leave
create policy "Anyone can view party members" on public.party_members
  for select using (true);

create policy "Users can join parties" on public.party_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave parties" on public.party_members
  for delete using (auth.uid() = user_id);

-- Messages: read/write for party
create policy "Anyone can read party messages" on public.party_messages
  for select using (true);

create policy "Authenticated users can send messages" on public.party_messages
  for insert with check (auth.uid() = user_id);

-- Profiles
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Anonymous'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update timestamp trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger parties_updated_at before update on public.parties
  for each row execute procedure public.update_updated_at();

-- Index for fast lookups
create index if not exists parties_code_idx on public.parties(code);
create index if not exists party_messages_party_id_idx on public.party_messages(party_id);
create index if not exists party_members_party_id_idx on public.party_members(party_id);

-- Enable Realtime for party_messages (for live chat):
-- In Supabase Dashboard: Database > Replication > turn ON for "party_messages" table
