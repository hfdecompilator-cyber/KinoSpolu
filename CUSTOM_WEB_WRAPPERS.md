# Custom Web Wrapper core

This project now includes a real "injectable wrapper" foundation for watch-party sync.

## Why wrappers are needed

Streaming providers usually do not expose watch-party APIs.  
To synchronize play/pause/seek legally, the app uses a WebView wrapper that:

1. Loads the official provider URL directly.
2. Injects a JavaScript bridge into that WebView context.
3. Hooks the provider page's HTML5 `video` element events.
4. Sends only control/state metadata to your sync backend.

No media bytes are proxied or restreamed.

## Bridge implementation

- Source file: `src/lib/wrapperBridge.ts`
- Function: `buildInjectableBridgeScript(config)`
- Exposed WebView API: `window.__watchPartyBridge`
- Supported command types: `play`, `pause`, `seek`
- Event payloads include: paused, currentTime, duration, volume, muted, playbackRate

## Service-specific wrapper configs

- `netflix`: Netflix host matching + selector list
- `voyo`: CZ/SK Voyo host matching + selector list
- `youtube`: YouTube-focused selector list
- fallback: generic HTML5 wrapper for all other providers

## App wiring

- In-app browser shows wrapper metadata and a copyable injectable script.
- Room creation payload stores wrapper metadata (`serviceId`, `bridgeVersion`, `bridgeType`) under selected content.
- Lobby UI displays wrapper version so host/guest debugging is easier.

## Mobile integration notes

- React Native WebView: pass the generated script via `injectedJavaScriptBeforeContentLoaded`.
- Flutter InAppWebView: run bridge script in `onLoadStop` and keep a postMessage channel.
- Always keep provider playback native (do not bypass DRM, do not capture protected streams).
