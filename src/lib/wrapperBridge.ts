export const WRAPPER_BRIDGE_VERSION = "1.0.0";

export type ServiceWrapperConfig = {
  serviceId: string;
  matchHosts: string[];
  videoSelectors: string[];
  commandCooldownMs: number;
  notes: string;
};

const DEFAULT_VIDEO_SELECTORS = [
  "video",
  '[data-uia="video-canvas"] video',
  ".html5-main-video",
];

export const SERVICE_WRAPPER_CONFIGS: Record<string, ServiceWrapperConfig> = {
  netflix: {
    serviceId: "netflix",
    matchHosts: ["netflix.com"],
    videoSelectors: ["video", '[data-uia="player"] video', ...DEFAULT_VIDEO_SELECTORS],
    commandCooldownMs: 150,
    notes: "Uses native HTML5 video element when available inside WebView.",
  },
  voyo: {
    serviceId: "voyo",
    matchHosts: ["voyo.nova.cz", "voyo.markiza.sk"],
    videoSelectors: ["video", ".vjs-tech", ...DEFAULT_VIDEO_SELECTORS],
    commandCooldownMs: 120,
    notes: "Covers CZ/SK Voyo domains with generic HTML5 hooks.",
  },
  youtube: {
    serviceId: "youtube",
    matchHosts: ["youtube.com", "youtu.be"],
    videoSelectors: [".html5-main-video", "video", ...DEFAULT_VIDEO_SELECTORS],
    commandCooldownMs: 100,
    notes: "High-frequency seek/play sync for YouTube-like players.",
  },
};

export const getWrapperConfig = (serviceId: string): ServiceWrapperConfig =>
  SERVICE_WRAPPER_CONFIGS[serviceId] ?? {
    serviceId,
    matchHosts: [],
    videoSelectors: DEFAULT_VIDEO_SELECTORS,
    commandCooldownMs: 150,
    notes: "Generic HTML5 video fallback wrapper.",
  };

export const buildInjectableBridgeScript = (config: ServiceWrapperConfig) => {
  const serializedConfig = JSON.stringify(config);
  return `
(() => {
  if (window.__watchPartyBridgeInstalled) return;
  window.__watchPartyBridgeInstalled = true;
  const bridgeVersion = "${WRAPPER_BRIDGE_VERSION}";
  const config = ${serializedConfig};

  const postMessage = (payload) => {
    const message = JSON.stringify({
      bridgeVersion,
      serviceId: config.serviceId,
      ...payload,
      ts: Date.now()
    });
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
      window.ReactNativeWebView.postMessage(message);
      return;
    }
    if (window.parent && window.parent !== window && typeof window.parent.postMessage === "function") {
      window.parent.postMessage(message, "*");
      return;
    }
    console.debug("[watch-party-bridge]", message);
  };

  const pickVideo = () => {
    for (const selector of config.videoSelectors) {
      const candidate = document.querySelector(selector);
      if (candidate && candidate.tagName === "VIDEO") return candidate;
    }
    return document.querySelector("video");
  };

  let video = null;
  let lastSyncMessageAt = 0;

  const emitState = (reason) => {
    if (!video) return;
    const now = Date.now();
    if (now - lastSyncMessageAt < config.commandCooldownMs && reason === "timeupdate") return;
    lastSyncMessageAt = now;
    postMessage({
      type: "video-state",
      reason,
      state: {
        paused: video.paused,
        currentTime: Number(video.currentTime || 0),
        duration: Number(video.duration || 0),
        volume: Number(video.volume || 1),
        muted: Boolean(video.muted),
        playbackRate: Number(video.playbackRate || 1),
      },
    });
  };

  const attach = (node) => {
    if (!node || node === video) return;
    video = node;
    ["play", "pause", "seeking", "seeked", "ratechange", "volumechange", "timeupdate"].forEach((eventName) => {
      video.addEventListener(eventName, () => emitState(eventName));
    });
    emitState("video-attached");
  };

  const scanForVideo = () => {
    const found = pickVideo();
    if (found) attach(found);
  };

  const applyRemoteCommand = (command) => {
    if (!video || !command || typeof command !== "object") return;
    const { action, at } = command;
    if (typeof at === "number" && Number.isFinite(at) && at >= 0) {
      video.currentTime = at;
    }
    if (action === "play") {
      video.play().catch(() => {});
    } else if (action === "pause") {
      video.pause();
    } else if (action === "seek" && typeof at === "number") {
      video.currentTime = at;
    }
    emitState("remote-command");
  };

  window.__watchPartyBridge = {
    version: bridgeVersion,
    config,
    applyRemoteCommand,
    rescan: scanForVideo,
  };

  const observer = new MutationObserver(() => scanForVideo());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  scanForVideo();
  postMessage({
    type: "bridge-ready",
    info: {
      serviceId: config.serviceId,
      selectors: config.videoSelectors,
      notes: config.notes,
    },
  });
})();
`.trim();
};
