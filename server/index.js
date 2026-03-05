import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { netflixLogin, getNetflixProfiles, getDemoProfiles, getDemoContent } from './netflix-client.js';
import {
  createRoom, joinRoom, leaveRoom, getRoom,
  updatePlayback, addChatMessage, listRooms,
} from './room-manager.js';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// In-memory session store (maps sessionId → Netflix cookies + user info)
const sessions = new Map();

// ─── Netflix Auth Routes ───────────────────────────────────────────

/**
 * POST /api/netflix/login
 * HEARO-style authentication: accepts Netflix credentials and authenticates
 * server-side, capturing session cookies (same as HEARO's WebView approach).
 */
app.post('/api/netflix/login', async (req, res) => {
  const { email, password, demo } = req.body;

  if (demo) {
    const sessionId = randomUUID();
    sessions.set(sessionId, {
      isDemo: true,
      email: 'demo@example.com',
      profiles: getDemoProfiles(),
      selectedProfile: null,
      cookies: {},
    });
    return res.json({
      success: true,
      sessionId,
      isDemo: true,
      message: 'Demo mode activated. Using simulated Netflix data.',
    });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  console.log(`[Netflix Auth] Attempting login for: ${email}`);
  const result = await netflixLogin(email, password);

  if (result.success) {
    const sessionId = randomUUID();
    sessions.set(sessionId, {
      isDemo: false,
      email,
      cookies: result.cookies,
      profiles: null,
      selectedProfile: null,
    });
    console.log(`[Netflix Auth] Login successful for: ${email}`);
    return res.json({ success: true, sessionId, isDemo: false });
  }

  console.log(`[Netflix Auth] Login failed: ${result.code} - ${result.error}`);
  return res.status(401).json({
    success: false,
    error: result.error,
    code: result.code,
  });
});

/**
 * GET /api/netflix/profiles
 * Fetch the user's Netflix profiles (like HEARO's profile selection screen).
 */
app.get('/api/netflix/profiles', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated. Please login first.' });
  }

  if (session.isDemo) {
    return res.json({ success: true, profiles: session.profiles, isDemo: true });
  }

  if (session.profiles) {
    return res.json({ success: true, profiles: session.profiles });
  }

  const result = await getNetflixProfiles(session.cookies);
  if (result.success) {
    session.profiles = result.profiles;
    return res.json({ success: true, profiles: result.profiles });
  }

  return res.status(500).json({ success: false, error: result.error, code: result.code });
});

/**
 * POST /api/netflix/select-profile
 */
app.post('/api/netflix/select-profile', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);
  const { profileId, profileName, profileAvatar } = req.body;

  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  }

  session.selectedProfile = { id: profileId, name: profileName, avatar: profileAvatar };
  return res.json({ success: true, profile: session.selectedProfile });
});

/**
 * GET /api/netflix/browse
 * Get browseable content. Uses demo data for demo sessions.
 */
app.get('/api/netflix/browse', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  }

  return res.json({ success: true, content: getDemoContent(), isDemo: session.isDemo });
});

/**
 * GET /api/netflix/session
 * Check current session state.
 */
app.get('/api/netflix/session', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ success: false, error: 'No active session.' });
  }

  return res.json({
    success: true,
    isDemo: session.isDemo,
    email: session.email,
    profile: session.selectedProfile,
    hasProfiles: !!session.profiles,
  });
});

/**
 * POST /api/netflix/logout
 */
app.post('/api/netflix/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  sessions.delete(sessionId);
  return res.json({ success: true });
});

// ─── Room Routes ───────────────────────────────────────────────────

app.post('/api/rooms', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session || !session.selectedProfile) {
    return res.status(401).json({ success: false, error: 'Must be authenticated with a selected profile.' });
  }

  const { title, titleImage } = req.body;
  const room = createRoom({
    hostId: sessionId,
    hostName: session.selectedProfile.name,
    hostAvatar: session.selectedProfile.avatar,
    title,
    titleImage,
  });

  return res.json({ success: true, room });
});

app.get('/api/rooms', (_req, res) => {
  return res.json({ success: true, rooms: listRooms() });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ success: false, error: 'Room not found.' });
  return res.json({ success: true, room });
});

app.post('/api/rooms/:code/join', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session || !session.selectedProfile) {
    return res.status(401).json({ success: false, error: 'Must be authenticated with a selected profile.' });
  }

  const result = joinRoom(req.params.code, {
    userId: sessionId,
    userName: session.selectedProfile.name,
    userAvatar: session.selectedProfile.avatar,
  });

  if (result.error) {
    return res.status(result.code === 'NOT_FOUND' ? 404 : 400).json({ success: false, error: result.error });
  }

  return res.json({ success: true, room: result.room });
});

app.post('/api/rooms/:code/leave', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  leaveRoom(req.params.code, sessionId);
  return res.json({ success: true });
});

// ─── WebSocket (Real-time room sync) ──────────────────────────────

const wss = new WebSocketServer({ server, path: '/ws' });

const roomClients = new Map(); // roomCode → Set<{ ws, sessionId, userName }>

function broadcastToRoom(code, message, excludeSessionId = null) {
  const clients = roomClients.get(code);
  if (!clients) return;

  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.sessionId !== excludeSessionId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  let sessionId = null;
  let userName = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const session = sessions.get(msg.sessionId);

    switch (msg.type) {
      case 'join_room': {
        sessionId = msg.sessionId;
        currentRoom = msg.roomCode;
        userName = session?.selectedProfile?.name || 'Guest';

        if (!roomClients.has(currentRoom)) {
          roomClients.set(currentRoom, new Set());
        }
        roomClients.get(currentRoom).add({ ws, sessionId, userName });

        const room = getRoom(currentRoom);
        if (room) {
          ws.send(JSON.stringify({ type: 'room_state', room }));
          broadcastToRoom(currentRoom, {
            type: 'user_joined',
            user: { id: sessionId, name: userName },
          }, sessionId);
        }
        break;
      }

      case 'playback_update': {
        if (!currentRoom) return;
        const playback = updatePlayback(currentRoom, sessionId, msg.state);
        if (playback) {
          broadcastToRoom(currentRoom, {
            type: 'playback_sync',
            state: playback,
          }, sessionId);
        }
        break;
      }

      case 'chat_message': {
        if (!currentRoom || !sessionId) return;
        const chatMsg = addChatMessage(currentRoom, sessionId, userName, msg.message);
        if (chatMsg) {
          broadcastToRoom(currentRoom, { type: 'chat_message', ...chatMsg });
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && sessionId) {
      const clients = roomClients.get(currentRoom);
      if (clients) {
        for (const client of clients) {
          if (client.ws === ws) { clients.delete(client); break; }
        }
        if (clients.size === 0) roomClients.delete(currentRoom);
      }
      broadcastToRoom(currentRoom, { type: 'user_left', userId: sessionId });
      leaveRoom(currentRoom, sessionId);
    }
  });
});

// ─── Start ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  🎬 Netflix Room Auth Server (HEARO-style)`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  API:       http://localhost:${PORT}/api`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`  ─────────────────────────────────────────\n`);
});
