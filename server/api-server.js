import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { URL } from "node:url";
import axios from "axios";

const PORT = Number(process.env.API_PORT ?? 8787);
const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;
const NETFLIX_BROWSE_URL =
  process.env.NETFLIX_BROWSE_URL ?? "https://www.netflix.com/browse";

const SERVICE_CATALOG = [
  {
    id: "netflix",
    name: "Netflix",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.netflix.com/signup",
  },
  {
    id: "disney_plus",
    name: "Disney+",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.disneyplus.com/",
  },
  {
    id: "hulu",
    name: "Hulu",
    markets: ["global"],
    signupUrl: "https://www.hulu.com/",
  },
  {
    id: "prime_video",
    name: "Prime Video",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.primevideo.com/",
  },
  {
    id: "hbo_max",
    name: "HBO Max",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.max.com/",
  },
  { id: "plex", name: "Plex", markets: ["global"], signupUrl: "https://www.plex.tv/" },
  {
    id: "paramount_plus",
    name: "Paramount+",
    markets: ["global"],
    signupUrl: "https://www.paramountplus.com/",
  },
  {
    id: "youtube",
    name: "YouTube",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.youtube.com/",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.crunchyroll.com/",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://workspace.google.com/products/drive/",
  },
  {
    id: "pluto_tv",
    name: "Pluto TV",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://pluto.tv/",
  },
  { id: "tubi", name: "Tubi", markets: ["global"], signupUrl: "https://tubitv.com/" },
  {
    id: "youtube_tv",
    name: "YouTube TV",
    markets: ["global"],
    signupUrl: "https://tv.youtube.com/",
  },
  {
    id: "twitch",
    name: "Twitch",
    markets: ["global", "cz", "sk"],
    signupUrl: "https://www.twitch.tv/",
  },
  {
    id: "voyo",
    name: "Voyo",
    markets: ["cz", "sk"],
    signupUrl: "https://voyo.nova.cz/",
  },
  {
    id: "ivysilani",
    name: "iVysilani",
    markets: ["cz"],
    signupUrl: "https://www.ceskatelevize.cz/ivysilani/",
  },
  {
    id: "rtvs",
    name: "RTVS",
    markets: ["sk"],
    signupUrl: "https://www.rtvs.sk/televizia/archiv",
  },
  {
    id: "prima_plus",
    name: "Prima+",
    markets: ["cz", "sk"],
    signupUrl: "https://www.iprima.cz/",
  },
  {
    id: "o2_tv",
    name: "O2 TV",
    markets: ["cz"],
    signupUrl: "https://www.o2tv.cz/",
  },
  {
    id: "skylink_live_tv",
    name: "Skylink Live TV",
    markets: ["cz", "sk"],
    signupUrl: "https://livetv.skylink.cz/",
  },
];

const serviceById = new Map(SERVICE_CATALOG.map((entry) => [entry.id, entry]));

const accessTokens = new Map();
const rooms = new Map();

const json = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const isNetflixLoginResponse = (response) => {
  const location = String(response.headers?.location ?? "").toLowerCase();
  const content = String(response.data ?? "").toLowerCase();

  if (response.status === 401 || response.status === 403) {
    return true;
  }
  if (location.includes("/login")) {
    return true;
  }
  if (content.includes("membersignin") || content.includes("login-form")) {
    return true;
  }
  if (content.includes("sign in to netflix")) {
    return true;
  }
  return false;
};

const verifyNetflixSession = async ({ netflixId, secureNetflixId }) => {
  const cookieHeader = `NetflixId=${netflixId}; SecureNetflixId=${secureNetflixId};`;

  const response = await axios.get(NETFLIX_BROWSE_URL, {
    headers: {
      Cookie: cookieHeader,
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    maxRedirects: 0,
    validateStatus: () => true,
    timeout: 10000,
  });

  return !isNetflixLoginResponse(response);
};

const makeRoomCode = () => randomBytes(3).toString("hex").toUpperCase();

const getRoomOrNull = (code) => {
  if (!code) {
    return null;
  }
  return rooms.get(code.toUpperCase()) ?? null;
};

const buildRoomSnapshot = (room) => ({
  id: room.id,
  code: room.code,
  roomName: room.roomName,
  hostName: room.hostName,
  serviceId: room.serviceId,
  serviceName: room.serviceName,
  createdAt: room.createdAt,
  partyLink: room.partyLink,
  legalMode: room.legalMode,
  legalNotice: room.legalNotice,
  selectedContent: room.selectedContent,
  roomTier: room.roomTier,
  participantLimit: room.participantLimit,
  participants: room.participants,
  playback: room.playback,
  messages: room.messages,
});

const pruneExpiredAccessTokens = () => {
  const now = Date.now();
  for (const [key, token] of accessTokens.entries()) {
    if (token.expiresAt <= now) {
      accessTokens.delete(key);
    }
  }
};

const issueAccessToken = ({ serviceId, displayName, method }) => {
  const accessToken = randomUUID();
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
  accessTokens.set(accessToken, {
    serviceId,
    displayName,
    method,
    issuedAt: Date.now(),
    expiresAt,
  });
  return {
    accessToken,
    expiresAt: new Date(expiresAt).toISOString(),
  };
};

const readAccessToken = ({ accessToken, requiredServiceId }) => {
  pruneExpiredAccessTokens();
  const tokenRecord = accessTokens.get(accessToken);
  if (!tokenRecord) {
    return null;
  }
  if (requiredServiceId && tokenRecord.serviceId !== requiredServiceId) {
    return null;
  }
  return tokenRecord;
};

const createLegalNotice = (serviceName) =>
  `Each participant must hold independent rights to view ${serviceName}. This app only syncs playback state and chat, and does not rebroadcast copyrighted media.`;

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    json(res, 400, { ok: false, error: "Missing request URL." });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && parsedUrl.pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      service: "netflix-room-auth-api",
      now: new Date().toISOString(),
      rooms: rooms.size,
      services: SERVICE_CATALOG.length,
      targetMarkets: ["cz", "sk", "global"],
    });
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/services") {
    json(res, 200, {
      ok: true,
      services: SERVICE_CATALOG,
    });
    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/access/verify") {
    try {
      const body = await readJsonBody(req);
      const serviceId = String(body.serviceId ?? "").trim();
      const displayName = String(body.displayName ?? "").trim();
      const netflixId = String(body.netflixId ?? "").trim();
      const secureNetflixId = String(body.secureNetflixId ?? "").trim();
      const accountReference = String(body.accountReference ?? "").trim();
      const attestationAccepted = Boolean(body.attestationAccepted);

      if (!serviceById.has(serviceId)) {
        json(res, 400, { ok: false, error: "Unsupported streaming service." });
        return;
      }
      if (!displayName) {
        json(res, 400, { ok: false, error: "Display name is required." });
        return;
      }

      if (serviceId === "netflix") {
        if (!netflixId || !secureNetflixId) {
          json(res, 400, {
            ok: false,
            error: "Both NetflixId and SecureNetflixId are required.",
          });
          return;
        }

        const isValid = await verifyNetflixSession({ netflixId, secureNetflixId });
        if (!isValid) {
          json(res, 401, {
            ok: false,
            error:
              "Netflix session verification failed. Sign in to Netflix first, then retry with fresh cookies.",
          });
          return;
        }

        const token = issueAccessToken({
          serviceId,
          displayName,
          method: "netflix_session_cookie",
        });
        json(res, 200, {
          ok: true,
          serviceId,
          displayName,
          accessToken: token.accessToken,
          expiresAt: token.expiresAt,
          legalNotice: createLegalNotice("Netflix"),
          note: "Netflix access verified. You can create or join a room.",
        });
        return;
      }

      if (!attestationAccepted) {
        json(res, 400, {
          ok: false,
          error:
            "You must accept the access attestation before creating or joining a room.",
        });
        return;
      }
      if (accountReference.length < 3) {
        json(res, 400, {
          ok: false,
          error: "Account reference must be at least 3 characters.",
        });
        return;
      }

      const service = serviceById.get(serviceId);
      const token = issueAccessToken({
        serviceId,
        displayName,
        method: "user_attestation",
      });
      json(res, 200, {
        ok: true,
        serviceId,
        displayName,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        legalNotice: createLegalNotice(service.name),
        note: `${service.name} access attestation recorded.`,
      });
      return;
    } catch {
      json(res, 500, {
        ok: false,
        error: "Unable to verify service access at this time.",
      });
      return;
    }
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/netflix/verify-session") {
    try {
      const body = await readJsonBody(req);
      const netflixId = String(body.netflixId ?? "").trim();
      const secureNetflixId = String(body.secureNetflixId ?? "").trim();
      const displayName = String(body.displayName ?? "Viewer").trim();
      if (!netflixId || !secureNetflixId) {
        json(res, 400, {
          ok: false,
          error: "Both NetflixId and SecureNetflixId are required.",
        });
        return;
      }

      const isValid = await verifyNetflixSession({ netflixId, secureNetflixId });
      if (!isValid) {
        json(res, 401, {
          ok: false,
          error:
            "Netflix session verification failed. Sign in to Netflix first, then retry with fresh cookies.",
        });
        return;
      }
      const token = issueAccessToken({
        serviceId: "netflix",
        displayName,
        method: "netflix_session_cookie",
      });
      json(res, 200, {
        ok: true,
        serviceId: "netflix",
        accessToken: token.accessToken,
        verificationToken: token.accessToken,
        expiresAt: token.expiresAt,
        note: "Netflix authentication verified. You can now create a room.",
      });
      return;
    } catch {
      json(res, 500, {
        ok: false,
        error: "Unable to verify Netflix session at this time.",
      });
      return;
    }
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/rooms") {
    try {
      const body = await readJsonBody(req);
      const accessToken = String(body.accessToken ?? body.verificationToken ?? "").trim();
      const serviceId = String(body.serviceId ?? "").trim();
      const roomName = String(body.roomName ?? "").trim();
      const hostName = String(body.hostName ?? "").trim();
      const roomTier = String(body.roomTier ?? "free").trim().toLowerCase();
      const contentTitle = String(body.contentTitle ?? "").trim();
      const contentKind = String(body.contentKind ?? "").trim();
      const contentUrl = String(body.contentUrl ?? "").trim();
      const contentThumbnail = String(body.contentThumbnail ?? "").trim();
      const service = serviceById.get(serviceId);
      const participantLimit = roomTier === "premium" ? 10 : 3;

      if (!service) {
        json(res, 400, {
          ok: false,
          error: "A supported serviceId is required.",
        });
        return;
      }
      if (!accessToken) {
        json(res, 401, {
          ok: false,
          error: "A valid service access token is required before creating a room.",
        });
        return;
      }
      const tokenRecord = readAccessToken({
        accessToken,
        requiredServiceId: serviceId,
      });
      if (!tokenRecord) {
        json(res, 401, {
          ok: false,
          error: "Access token is invalid or expired for this service.",
        });
        return;
      }
      if (!roomName || !hostName) {
        json(res, 400, {
          ok: false,
          error: "Room name and host name are required.",
        });
        return;
      }
      if (!["free", "premium"].includes(roomTier)) {
        json(res, 400, {
          ok: false,
          error: "roomTier must be free or premium.",
        });
        return;
      }
      if (!contentTitle || !contentUrl) {
        json(res, 400, {
          ok: false,
          error: "Pick a movie/show/video in the in-app browser before creating lobby.",
        });
        return;
      }

      const hostParticipantId = randomUUID();
      const room = {
        id: randomUUID(),
        code: makeRoomCode(),
        roomName,
        hostName,
        serviceId,
        serviceName: service.name,
        createdAt: new Date().toISOString(),
        legalMode: "bring_your_own_subscription",
        legalNotice: createLegalNotice(service.name),
        selectedContent: {
          title: contentTitle,
          kind: contentKind || "title",
          url: contentUrl,
          thumbnail: contentThumbnail || null,
          pickedAt: new Date().toISOString(),
          pickedBy: hostName,
        },
        roomTier,
        participantLimit,
        partyLink: "/room/pending",
        participants: [
          {
            id: hostParticipantId,
            name: hostName,
            role: "host",
            accessVerified: true,
            verificationMethod: tokenRecord.method,
            joinedAt: new Date().toISOString(),
          },
        ],
        playback: {
          status: "paused",
          positionSec: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: hostName,
        },
        messages: [
          {
            id: randomUUID(),
            participantId: hostParticipantId,
            senderName: "System",
            text: `${hostName} started the party.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      room.partyLink = `/room/${room.code}`;
      rooms.set(room.code, room);

      json(res, 201, {
        ok: true,
        room: buildRoomSnapshot(room),
        participantId: hostParticipantId,
      });
      return;
    } catch {
      json(res, 500, {
        ok: false,
        error: "Could not create room.",
      });
      return;
    }
  }

  if (req.method === "GET" && parsedUrl.pathname.startsWith("/api/rooms/")) {
    const code = parsedUrl.pathname.split("/")[3];
    const room = getRoomOrNull(code);
    if (!room) {
      json(res, 404, { ok: false, error: "Room not found." });
      return;
    }
    json(res, 200, { ok: true, room: buildRoomSnapshot(room) });
    return;
  }

  if (req.method === "POST" && parsedUrl.pathname.match(/^\/api\/rooms\/[^/]+\/join$/)) {
    try {
      const code = parsedUrl.pathname.split("/")[3];
      const room = getRoomOrNull(code);
      if (!room) {
        json(res, 404, { ok: false, error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const displayName = String(body.displayName ?? "").trim();
      const accessToken = String(body.accessToken ?? "").trim();
      if (!displayName) {
        json(res, 400, { ok: false, error: "Display name is required." });
        return;
      }
      const tokenRecord = readAccessToken({
        accessToken,
        requiredServiceId: room.serviceId,
      });
      if (!tokenRecord) {
        json(res, 401, {
          ok: false,
          error:
            "A valid access token for this room's streaming service is required to join.",
        });
        return;
      }

      if (room.participants.length >= room.participantLimit) {
        json(res, 400, {
          ok: false,
          error: `Room is full for ${room.roomTier} tier (limit ${room.participantLimit}).`,
        });
        return;
      }

      const participantId = randomUUID();
      const participant = {
        id: participantId,
        name: displayName,
        role: "guest",
        accessVerified: true,
        verificationMethod: tokenRecord.method,
        joinedAt: new Date().toISOString(),
      };
      room.participants.push(participant);
      room.messages.push({
        id: randomUUID(),
        participantId,
        senderName: "System",
        text: `${displayName} joined the party.`,
        createdAt: new Date().toISOString(),
      });

      json(res, 200, {
        ok: true,
        participantId,
        room: buildRoomSnapshot(room),
      });
      return;
    } catch {
      json(res, 500, { ok: false, error: "Unable to join room." });
      return;
    }
  }

  if (
    req.method === "POST" &&
    parsedUrl.pathname.match(/^\/api\/rooms\/[^/]+\/playback$/)
  ) {
    try {
      const code = parsedUrl.pathname.split("/")[3];
      const room = getRoomOrNull(code);
      if (!room) {
        json(res, 404, { ok: false, error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const participantId = String(body.participantId ?? "").trim();
      const action = String(body.action ?? "").trim();
      const positionSec = Number(body.positionSec ?? room.playback.positionSec);

      const participant = room.participants.find((entry) => entry.id === participantId);
      if (!participant) {
        json(res, 401, { ok: false, error: "Invalid participant." });
        return;
      }

      if (participant.role !== "host") {
        json(res, 403, { ok: false, error: "Only host can control playback." });
        return;
      }

      if (!["play", "pause", "seek"].includes(action)) {
        json(res, 400, { ok: false, error: "Action must be play, pause, or seek." });
        return;
      }

      if (!Number.isFinite(positionSec) || positionSec < 0) {
        json(res, 400, { ok: false, error: "positionSec must be a non-negative number." });
        return;
      }

      if (action === "play") {
        room.playback.status = "playing";
      }
      if (action === "pause") {
        room.playback.status = "paused";
      }

      room.playback.positionSec = Number(positionSec.toFixed(1));
      room.playback.updatedAt = new Date().toISOString();
      room.playback.updatedBy = participant.name;

      room.messages.push({
        id: randomUUID(),
        participantId,
        senderName: "System",
        text: `${participant.name} set playback to ${room.playback.status} at ${Math.round(room.playback.positionSec)}s.`,
        createdAt: new Date().toISOString(),
      });
      if (room.messages.length > 120) {
        room.messages = room.messages.slice(-120);
      }

      json(res, 200, { ok: true, playback: room.playback, room: buildRoomSnapshot(room) });
      return;
    } catch {
      json(res, 500, { ok: false, error: "Unable to update playback." });
      return;
    }
  }

  if (
    req.method === "POST" &&
    parsedUrl.pathname.match(/^\/api\/rooms\/[^/]+\/messages$/)
  ) {
    try {
      const code = parsedUrl.pathname.split("/")[3];
      const room = getRoomOrNull(code);
      if (!room) {
        json(res, 404, { ok: false, error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const participantId = String(body.participantId ?? "").trim();
      const text = String(body.text ?? "").trim();
      if (!text) {
        json(res, 400, { ok: false, error: "Message text is required." });
        return;
      }

      const participant = room.participants.find((entry) => entry.id === participantId);
      if (!participant) {
        json(res, 401, { ok: false, error: "Invalid participant." });
        return;
      }

      room.messages.push({
        id: randomUUID(),
        participantId,
        senderName: participant.name,
        text,
        createdAt: new Date().toISOString(),
      });
      if (room.messages.length > 120) {
        room.messages = room.messages.slice(-120);
      }

      json(res, 201, { ok: true, room: buildRoomSnapshot(room) });
      return;
    } catch {
      json(res, 500, { ok: false, error: "Unable to send message." });
      return;
    }
  }

  if (
    req.method === "POST" &&
    parsedUrl.pathname.match(/^\/api\/rooms\/[^/]+\/leave$/)
  ) {
    try {
      const code = parsedUrl.pathname.split("/")[3];
      const room = getRoomOrNull(code);
      if (!room) {
        json(res, 404, { ok: false, error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const participantId = String(body.participantId ?? "").trim();
      const index = room.participants.findIndex((entry) => entry.id === participantId);
      if (index === -1) {
        json(res, 401, { ok: false, error: "Invalid participant." });
        return;
      }

      const [participant] = room.participants.splice(index, 1);
      room.messages.push({
        id: randomUUID(),
        participantId,
        senderName: "System",
        text: `${participant.name} left the party.`,
        createdAt: new Date().toISOString(),
      });
      if (room.messages.length > 120) {
        room.messages = room.messages.slice(-120);
      }

      json(res, 200, { ok: true });
      return;
    } catch {
      json(res, 500, { ok: false, error: "Unable to leave room." });
      return;
    }
    return;
  }

  json(res, 404, { ok: false, error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Netflix room auth API listening on http://localhost:${PORT}`);
});
