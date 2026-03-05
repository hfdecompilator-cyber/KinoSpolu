import { randomUUID } from 'crypto';

const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom({ hostId, hostName, hostAvatar, title, titleImage }) {
  let code;
  do {
    code = generateCode();
  } while (rooms.has(code));

  const room = {
    code,
    hostId,
    title: title || null,
    titleImage: titleImage || null,
    service: 'netflix',
    createdAt: Date.now(),
    participants: [
      { id: hostId, name: hostName, avatar: hostAvatar, isHost: true, joinedAt: Date.now() },
    ],
    playback: {
      playing: false,
      position: 0,
      updatedAt: Date.now(),
      updatedBy: hostId,
    },
    chat: [],
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(code, { userId, userName, userAvatar }) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found', code: 'NOT_FOUND' };

  const existing = room.participants.find(p => p.id === userId);
  if (existing) return { room };

  if (room.participants.length >= 10) {
    return { error: 'Room is full (max 10 participants)', code: 'ROOM_FULL' };
  }

  room.participants.push({
    id: userId,
    name: userName,
    avatar: userAvatar,
    isHost: false,
    joinedAt: Date.now(),
  });

  return { room };
}

export function leaveRoom(code, userId) {
  const room = rooms.get(code);
  if (!room) return;

  room.participants = room.participants.filter(p => p.id !== userId);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return { deleted: true };
  }

  if (room.hostId === userId && room.participants.length > 0) {
    room.hostId = room.participants[0].id;
    room.participants[0].isHost = true;
  }

  return { room };
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function updatePlayback(code, userId, state) {
  const room = rooms.get(code);
  if (!room) return null;

  room.playback = {
    ...room.playback,
    ...state,
    updatedAt: Date.now(),
    updatedBy: userId,
  };

  return room.playback;
}

export function addChatMessage(code, userId, userName, message) {
  const room = rooms.get(code);
  if (!room) return null;

  const msg = {
    id: randomUUID(),
    userId,
    userName,
    message,
    timestamp: Date.now(),
  };

  room.chat.push(msg);

  if (room.chat.length > 200) {
    room.chat = room.chat.slice(-100);
  }

  return msg;
}

export function listRooms() {
  return Array.from(rooms.values()).map(r => ({
    code: r.code,
    title: r.title,
    titleImage: r.titleImage,
    hostName: r.participants.find(p => p.isHost)?.name || 'Unknown',
    participantCount: r.participants.length,
    createdAt: r.createdAt,
  }));
}
