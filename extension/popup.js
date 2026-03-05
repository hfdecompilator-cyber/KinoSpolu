const $ = (id) => document.getElementById(id);

async function getActiveNetflixTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  const url = tab.url || "";
  const isNetflix = url.startsWith("https://www.netflix.com/") || url.startsWith("https://netflix.com/") || url.startsWith("http://netflix.com/");
  if (!isNetflix) throw new Error("Active tab is not netflix.com");
  return tab;
}

function normalizeRoomCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

async function loadDefaults() {
  const stored = await chrome.storage.local.get(["wsUrl", "roomCode", "hostKey", "displayName"]);
  $("wsUrl").value = stored.wsUrl || "ws://localhost:8787";
  $("roomCode").value = stored.roomCode || "";
  $("hostKey").value = stored.hostKey || "";
  $("displayName").value = stored.displayName || "Netflix";
}

function setStatus(text) {
  $("status").textContent = text;
}

async function sendToContent(message) {
  const tab = await getActiveNetflixTab();
  return chrome.tabs.sendMessage(tab.id, message);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadDefaults();

  $("connect").addEventListener("click", async () => {
    try {
      const wsUrl = $("wsUrl").value.trim();
      const roomCode = normalizeRoomCode($("roomCode").value);
      const hostKey = $("hostKey").value.trim();
      const displayName = $("displayName").value.trim() || "Netflix";

      await chrome.storage.local.set({ wsUrl, roomCode, hostKey, displayName });

      setStatus("connecting");
      const resp = await sendToContent({ type: "STREAMHUB_CONNECT", wsUrl, roomCode, hostKey, displayName });
      setStatus(resp?.ok ? "connected" : resp?.error || "failed");
    } catch (e) {
      setStatus(String(e?.message || e));
    }
  });

  $("disconnect").addEventListener("click", async () => {
    try {
      setStatus("disconnecting");
      const resp = await sendToContent({ type: "STREAMHUB_DISCONNECT" });
      setStatus(resp?.ok ? "idle" : resp?.error || "failed");
    } catch (e) {
      setStatus(String(e?.message || e));
    }
  });
});

