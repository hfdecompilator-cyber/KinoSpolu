-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  video_url text not null,
  video_title text not null default 'Watch party',
  host_id uuid not null,
  party_code text not null unique,
  created_at timestamptz not null default now(),
  is_active boolean default true
);

alter table public.parties add column if not exists host_name text;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  party_code text not null references public.parties(party_code) on delete cascade,
  sender_id uuid not null,
  sender_name text not null,
  message text not null check (char_length(message) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.playback_events (
  id bigint generated always as identity primary key,
  party_code text not null references public.parties(party_code) on delete cascade,
  sender_id uuid not null,
  action text not null check (action in ('play', 'pause', 'seek')),
  "current_time" numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_party_created
  on public.chat_messages (party_code, created_at);

create index if not exists idx_playback_events_party_created
  on public.playback_events (party_code, created_at desc);

create unique index if not exists idx_parties_party_code
  on public.parties (party_code);

alter table public.parties enable row level security;
alter table public.chat_messages enable row level security;
alter table public.playback_events enable row level security;

drop policy if exists "parties_select_all" on public.parties;
create policy "parties_select_all" on public.parties
for select using (true);

drop policy if exists "parties_insert_auth" on public.parties;
create policy "parties_insert_auth" on public.parties
for insert with check (auth.uid() = host_id);

drop policy if exists "chat_select_all" on public.chat_messages;
create policy "chat_select_all" on public.chat_messages
for select using (true);

drop policy if exists "chat_insert_auth" on public.chat_messages;
create policy "chat_insert_auth" on public.chat_messages
for insert with check (auth.uid() = sender_id);

drop policy if exists "playback_select_all" on public.playback_events;
create policy "playback_select_all" on public.playback_events
for select using (true);

drop policy if exists "playback_insert_auth" on public.playback_events;
create policy "playback_insert_auth" on public.playback_events
for insert with check (auth.uid() = sender_id);

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.playback_events;
