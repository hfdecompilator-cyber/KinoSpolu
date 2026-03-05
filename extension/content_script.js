(() => {
  const DEFAULT_WS_URL = "ws://localhost:8787";

  const state = {
    ws: null,
    wsUrl: DEFAULT_WS_URL,
    roomCode: null,
    hostKey: null,
    displayName: "Netflix",
    clientId: null,
    suppressUntilMs: 0,
  };

  function getClientId() {
    if (state.clientId) return state.clientId;
    const key = "streamhub_ext_client_id";
    const existing = localStorage.getItem(key);
    if (existing) {
      state.clientId = existing;
      return existing;
    }
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    state.clientId = created;
    return created;
  }

  function safeSend(obj) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify(obj));
  }

  function getVideo() {
    return document.querySelector("video");
  }

  function withSuppress(ms, fn) {
    state.suppressUntilMs = Date.now() + ms;
    try {
      fn();
    } finally {
      // leave suppress active for duration
    }
  }

  function shouldSuppress() {
    return Date.now() < state.suppressUntilMs;
  }

  function attachVideoListeners() {
    const v = getVideo();
    if (!v) return false;
    if (v.__streamhub_bound) return true;
    v.__streamhub_bound = true;

    v.addEventListener("play", () => {
      if (shouldSuppress()) return;
      safeSend({ type: "playback", roomCode: state.roomCode, clientId: getClientId(), action: "play" });
    });
    v.addEventListener("pause", () => {
      if (shouldSuppress()) return;
      safeSend({ type: "playback", roomCode: state.roomCode, clientId: getClientId(), action: "pause" });
    });
    v.addEventListener("seeked", () => {
      if (shouldSuppress()) return;
      safeSend({
        type: "playback",
        roomCode: state.roomCode,
        clientId: getClientId(),
        action: "seek",
        timeSeconds: v.currentTime,
      });
    });
    return true;
  }

  function applyRoomState(roomState) {
    const v = getVideo();
    if (!v) return;

    // ignore our own last action to reduce ping-pong
    if (roomState.playback?.lastActionClientId && roomState.playback.lastActionClientId === getClientId()) return;

    const desiredPlaying = !!roomState.playback?.isPlaying;
    const desiredTime = Number(roomState.playback?.timeSeconds || 0);
    const timeDiff = Math.abs((v.currentTime || 0) - desiredTime);

    withSuppress(1500, () => {
      if (timeDiff > 0.75 && Number.isFinite(desiredTime)) {
        try {
          v.currentTime = desiredTime;
        } catch {}
      }
      if (desiredPlaying && v.paused) {
        v.play().catch(() => {});
      }
      if (!desiredPlaying && !v.paused) {
        v.pause();
      }
    });
  }

  function connect({ wsUrl, roomCode, hostKey, displayName }) {
    disconnect();

    state.wsUrl = wsUrl || DEFAULT_WS_URL;
    state.roomCode = String(roomCode || "").trim().toUpperCase();
    state.hostKey = hostKey ? String(hostKey).trim() : "";
    state.displayName = displayName ? String(displayName).trim() : "Netflix";

    if (!state.roomCode) throw new Error("Missing room code");

    const ws = new WebSocket(state.wsUrl);
    state.ws = ws;

    ws.addEventListener("open", () => {
      safeSend({
        type: "join_room",
        roomCode: state.roomCode,
        displayName: state.displayName,
        clientId: getClientId(),
        role: "netflix",
        hostKey: state.hostKey || undefined,
      });

      // Netflix loads the player lazily; poll a bit.
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        attachVideoListeners();
        if (tries > 40) clearInterval(timer);
      }, 500);
    });

    ws.addEventListener("message", (evt) => {
      let parsed;
      try {
        parsed = JSON.parse(String(evt.data));
      } catch {
        return;
      }
      if (parsed?.type === "room_state" && parsed.roomCode === state.roomCode) {
        applyRoomState(parsed);
      }
    });

    ws.addEventListener("close", () => {
      state.ws = null;
    });
  }

  function disconnect() {
    if (state.ws) {
      try {
        state.ws.close();
      } catch {}
    }
    state.ws = null;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    try {
      if (msg?.type === "STREAMHUB_CONNECT") {
        connect(msg);
        sendResponse({ ok: true });
        return;
      }
      if (msg?.type === "STREAMHUB_DISCONNECT") {
        disconnect();
        sendResponse({ ok: true });
        return;
      }
      sendResponse({ ok: false, error: "Unknown message" });
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  });
})();

