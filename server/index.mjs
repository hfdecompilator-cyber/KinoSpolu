import http from "node:http";
import { webcrypto } from "node:crypto";
import { WebSocketServer } from "ws";

function randomCode(length, alphabet) {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** @type {Map<string, {roomCode:string, hostKey:string, hostClientId:string, clients: Map<any, any>, playback: {isPlaying:boolean, timeSeconds:number, updatedAtMs:number, lastActionBy?:string, lastActionClientId?:string}, deleteTimer?: any }>} */
const rooms = new Map();

function createRoom(clientId) {
  let roomCode = randomCode(6, ROOM_ALPHABET);
  while (rooms.has(roomCode)) roomCode = randomCode(6, ROOM_ALPHABET);
  const hostKey = randomCode(16, KEY_ALPHABET);
  const room = {
    roomCode,
    hostKey,
    hostClientId: clientId,
    clients: new Map(),
    playback: { isPlaying: false, timeSeconds: 0, updatedAtMs: Date.now() },
    deleteTimer: undefined,
  };
  rooms.set(roomCode, room);
  return room;
}

function broadcastRoomState(room) {
  const participants = Array.from(room.clients.values()).map((c) => ({
    clientId: c.clientId,
    displayName: c.displayName,
    role: c.role,
    canControl: c.canControl,
  }));
  const payload = JSON.stringify({
    type: "room_state",
    roomCode: room.roomCode,
    hostClientId: room.hostClientId,
    participants,
    playback: room.playback,
  });
  for (const ws of room.clients.keys()) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  /** @type {{roomCode?:string, clientId?:string}} */
  const session = {};

  function sendError(message) {
    ws.send(JSON.stringify({ type: "error", message }));
  }

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      sendError("Invalid JSON");
      return;
    }

    if (msg?.type === "create_room") {
      if (!msg.clientId || !msg.displayName) {
        sendError("Missing fields");
        return;
      }
      const room = createRoom(msg.clientId);
      ws.send(
        JSON.stringify({
          type: "room_created",
          roomCode: room.roomCode,
          hostKey: room.hostKey,
          hostClientId: room.hostClientId,
        }),
      );
      // auto-join creator as web client, control enabled
      room.clients.set(ws, {
        clientId: msg.clientId,
        displayName: msg.displayName,
        role: "web",
        canControl: true,
      });
      session.roomCode = room.roomCode;
      session.clientId = msg.clientId;
      broadcastRoomState(room);
      return;
    }

    if (msg?.type === "join_room") {
      const roomCode = String(msg.roomCode ?? "").trim().toUpperCase();
      if (!roomCode || !rooms.has(roomCode)) {
        sendError("Room not found. Have the host create it first.");
        return;
      }
      const room = rooms.get(roomCode);
      if (room.deleteTimer) {
        clearTimeout(room.deleteTimer);
        room.deleteTimer = undefined;
      }
      if (!msg.clientId || !msg.displayName || !msg.role) {
        sendError("Missing fields");
        return;
      }

      const hostKey = typeof msg.hostKey === "string" ? msg.hostKey.trim() : "";
      const canControl = hostKey && hostKey === room.hostKey;

      room.clients.set(ws, {
        clientId: msg.clientId,
        displayName: msg.displayName,
        role: msg.role === "netflix" ? "netflix" : "web",
        canControl,
      });
      session.roomCode = roomCode;
      session.clientId = msg.clientId;
      broadcastRoomState(room);
      return;
    }

    if (msg?.type === "playback") {
      const roomCode = String(msg.roomCode ?? "").trim().toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) {
        sendError("Room not found");
        return;
      }
      const client = room.clients.get(ws);
      if (!client) {
        sendError("Join room first");
        return;
      }
      if (!client.canControl) {
        sendError("Host key required to control playback");
        return;
      }
      const action = msg.action;
      if (action !== "play" && action !== "pause" && action !== "seek") {
        sendError("Invalid action");
        return;
      }
      if (action === "seek") {
        const t = Number(msg.timeSeconds);
        if (!Number.isFinite(t) || t < 0) {
          sendError("Invalid timeSeconds");
          return;
        }
        room.playback.timeSeconds = t;
      }
      if (action === "play") room.playback.isPlaying = true;
      if (action === "pause") room.playback.isPlaying = false;
      room.playback.updatedAtMs = Date.now();
      room.playback.lastActionBy = client.displayName;
      room.playback.lastActionClientId = client.clientId;
      broadcastRoomState(room);
      return;
    }

    sendError("Unknown message type");
  });

  ws.on("close", () => {
    const roomCode = session.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      room.deleteTimer = setTimeout(() => {
        const still = rooms.get(roomCode);
        if (still && still.clients.size === 0) rooms.delete(roomCode);
      }, 10 * 60 * 1000);
      return;
    }
    broadcastRoomState(room);
  });
});

const port = Number(process.env.PORT || 8787);
server.listen(port, () => {
  console.log(`[sync] ws server listening on :${port}`);
});

