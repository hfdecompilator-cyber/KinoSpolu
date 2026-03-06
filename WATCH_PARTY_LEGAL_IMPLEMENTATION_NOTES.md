# KinoPulse watch-party legal implementation notes

## Competitor patterns we mirror

- Teleparty pattern: sync/control layer + chat; every viewer signs in to their own streaming subscription.
- Rave pattern: host-led playback controls, optional public rooms, account-based social graph and moderation.
- Google Play UGC policy baseline: clear rules, in-app reporting, user blocking, ongoing moderation operations.

## What this app now enforces in UI

1. **Service-first onboarding**
   - Users select a streaming host before profile authentication.
   - Session ties to selected host to avoid ambiguous rights/compliance state.

2. **Rights and domain guardrails**
   - Launch flow requires explicit rights confirmation checkbox.
   - Link validation checks host domains against selected service (warns on mismatches).
   - For subscription platforms, playback acts as synchronized companion flow and opens official links.

3. **UGC trust and safety controls**
   - Rule-consent gate for non-host chat participation.
   - Report abuse form, block list, mute/remove/freeze quick actions.
   - Join queue approvals and moderation activity logging.

## Supabase-ready schema direction

Use these tables when moving from local state to backend:

- `profiles(id uuid pk references auth.users, handle text unique, avatar_url text, bio text, created_at timestamptz)`
- `lobbies(id uuid pk, host_id uuid, title text, description text, service_id text, media_url text, is_public bool, is_locked bool, max_capacity int, created_at timestamptz)`
- `lobby_members(lobby_id uuid, user_id uuid, role text check(role in ('host','mod','viewer')), state text check(state in ('active','queued','banned','left')), joined_at timestamptz)`
- `friend_requests(id uuid pk, from_user uuid, to_user uuid, status text check(status in ('pending','accepted','rejected','cancelled')), created_at timestamptz)`
- `user_blocks(blocker_id uuid, blocked_id uuid, created_at timestamptz, primary key(blocker_id, blocked_id))`
- `moderation_events(id bigint generated always as identity, lobby_id uuid, actor_id uuid, target_id uuid, action text, reason text, meta jsonb, created_at timestamptz)`
- `chat_messages(id bigint generated always as identity, lobby_id uuid, sender_id uuid, body text, created_at timestamptz)`

## Realtime event contract

Channel name: `lobby:{lobby_id}`

- `playback.sync`: `{ playing, playhead, updatedAt, actorId }`
- `lobby.join_request`: `{ userId, handle, requestedAt }`
- `lobby.membership`: `{ userId, role, state, actorId }`
- `chat.message`: `{ messageId, senderId, body, createdAt }`
- `moderation.action`: `{ action, actorId, targetId, reason, createdAt }`
- `lobby.announcement`: `{ body, actorId, createdAt }`

## RLS direction

- Host/mod can update `lobby_members` for the same `lobby_id`.
- Viewers can only update their own membership row (`state = 'left'`).
- Blocked users cannot insert chat messages into the same lobby.
- Users can only view private lobby data if they are active members.
