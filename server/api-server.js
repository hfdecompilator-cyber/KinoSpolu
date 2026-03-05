import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { URL } from "node:url";
import axios from "axios";

const PORT = Number(process.env.API_PORT ?? 8787);
const TOKEN_TTL_MS = 10 * 60 * 1000;
const NETFLIX_BROWSE_URL =
  process.env.NETFLIX_BROWSE_URL ?? "https://www.netflix.com/browse";

const verificationTokens = new Map();
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

const pruneExpiredTokens = () => {
  const now = Date.now();
  for (const [key, token] of verificationTokens.entries()) {
    if (token.expiresAt <= now) {
      verificationTokens.delete(key);
    }
  }
};

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
    });
    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/netflix/verify-session") {
    try {
      const body = await readJsonBody(req);
      const netflixId = String(body.netflixId ?? "").trim();
      const secureNetflixId = String(body.secureNetflixId ?? "").trim();

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

      const verificationToken = randomUUID();
      const expiresAt = Date.now() + TOKEN_TTL_MS;
      verificationTokens.set(verificationToken, {
        verifiedAt: Date.now(),
        expiresAt,
      });

      json(res, 200, {
        ok: true,
        verificationToken,
        expiresAt: new Date(expiresAt).toISOString(),
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
      pruneExpiredTokens();
      const body = await readJsonBody(req);
      const verificationToken = String(body.verificationToken ?? "").trim();
      const roomName = String(body.roomName ?? "").trim();
      const hostName = String(body.hostName ?? "").trim();

      if (!verificationToken) {
        json(res, 401, {
          ok: false,
          error: "Netflix verification token is required before creating a room.",
        });
        return;
      }
      if (!verificationTokens.has(verificationToken)) {
        json(res, 401, {
          ok: false,
          error: "Verification token is invalid or expired. Verify Netflix again.",
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

      const room = {
        id: randomUUID(),
        code: makeRoomCode(),
        roomName,
        hostName,
        service: "netflix",
        createdAt: new Date().toISOString(),
      };

      rooms.set(room.code, room);

      json(res, 201, {
        ok: true,
        room,
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
    const code = parsedUrl.pathname.split("/").at(-1)?.toUpperCase();
    const room = code ? rooms.get(code) : null;
    if (!room) {
      json(res, 404, { ok: false, error: "Room not found." });
      return;
    }
    json(res, 200, { ok: true, room });
    return;
  }

  json(res, 404, { ok: false, error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Netflix room auth API listening on http://localhost:${PORT}`);
});
