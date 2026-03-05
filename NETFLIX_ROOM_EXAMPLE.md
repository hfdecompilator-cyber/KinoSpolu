# Netflix Room with HEARO-Style Authentication

This document explains how to create a Netflix watch party room that authenticates like the **HEARO** Android app. It covers the technical reality, limitations, and a working implementation pattern.

---

## 🔑 The Core Reality: Netflix Has No Public API

**Critical fact:** Netflix does **not** offer OAuth, API keys, or any official integration for third-party watch party apps. Unlike Spotify or YouTube, you cannot "connect" a user's Netflix account to your app through standard OAuth.

### How HEARO Does It

HEARO and similar apps (Teleparty, Watch2Gether for Netflix) use one of these approaches:

1. **Sync-Only Model** – Each participant uses their **own** Netflix subscription. The app syncs playback state (play/pause, timestamp) but does NOT stream or embed Netflix content. Users watch in the Netflix app or netflix.com in another tab.

2. **Connect + Deep Link** – "Connect Netflix" opens Netflix (browser or app) for the user to log in. The app then uses deep links like `https://www.netflix.com/watch/{videoId}` to launch specific content. The "authentication" is: *user has Netflix and is logged in* – the app never receives credentials.

3. **WebView (Risky)** – Some apps tried embedding Netflix in a WebView. Netflix actively blocks this and may show "Please watch in the Netflix app."

---

## 📱 HEARO-Style Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATE NETFLIX ROOM (HEARO-like flow)                           │
├─────────────────────────────────────────────────────────────────┤
│  1. User taps "Create Netflix Room"                              │
│  2. "Connect Netflix" step → Opens netflix.com (or Netflix app)   │
│     → User logs in to their Netflix account                      │
│     → App cannot capture session; we track "user confirmed"      │
│  3. User returns to app, taps "I'm connected"                     │
│  4. Create room: name, Netflix content URL/videoId                │
│  5. Share room code/link                                          │
│  6. Joiners repeat: Connect Netflix → Join room                   │
│  7. Sync: WebSocket broadcasts play/pause/seek → everyone stays  │
│     in sync while each watches in their own Netflix              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### 1. Netflix "Connect" Step (Authentication-Like)

Since we can't use OAuth, we simulate HEARO's "Connect Netflix" by:

- **Web:** Opening `https://www.netflix.com` in a new tab
- **Mobile (Android):** Using `Intent.ACTION_VIEW` with `https://www.netflix.com`
- **iOS:** Using `https://www.netflix.com` (opens in Safari or Netflix app if installed)

The user logs in on Netflix's page. We store a **local flag** (e.g. `netflixConnected: true`) to show they've completed the step. We do NOT get tokens or session data.

### 2. Netflix Content URLs

Netflix deep links for specific content:

| Platform | URL Format | Example |
|----------|------------|---------|
| Web/Browser | `https://www.netflix.com/watch/{videoId}` | `https://www.netflix.com/watch/70242311` |
| Title page | `https://www.netflix.com/title/{videoId}` | `https://www.netflix.com/title/70242311` |
| Android intent | Same URL – system opens Netflix app if installed | |

Video IDs are numeric (e.g. `70242311` for a specific movie/show). There is no public Netflix catalog API – you typically get these from Netflix URLs or your own curated list.

### 3. Room Creation with Netflix

When creating a Netflix room:

1. Require "Connect Netflix" to be completed first
2. Let user paste a Netflix URL or pick from a preset list
3. Extract `videoId` from URL (e.g. `/watch/70242311` → `70242311`)
4. Create room in your backend with `service: 'netflix'` and `videoId`
5. Sync server coordinates play/pause/seek via WebSocket

### 4. Playback Sync (No Embedding)

- Each user opens Netflix (browser or app) and navigates to the content
- Your app sends sync commands: `{ type: 'play', timestamp: 123.45 }`
- Clients adjust local playback to match
- This is how Teleparty, HEARO, and similar extensions/apps work

---

## 📄 Example Code

See `src/examples/CreateNetflixRoomExample.tsx` for a complete React component that:

- Implements the HEARO-style "Connect Netflix" step
- Creates a Netflix room with video selection
- Generates shareable room codes
- Uses Netflix deep links for opening content
- Is ready to plug into a WebSocket sync layer

---

## ⚠️ Limitations (Same as HEARO)

| Limitation | Reason |
|------------|--------|
| No OAuth/token from Netflix | Netflix does not provide this |
| Cannot verify subscription | No API to check account status |
| Cannot embed Netflix video | Netflix blocks iframes/WebViews |
| No catalog API | Must use URLs or your own list |
| Sync only | Each user must have Netflix and play in Netflix |

---

## ✅ What This Gives You

- A **Connect Netflix** step that matches HEARO's UX
- Room creation with Netflix as the streaming service
- Deep links so users open the correct Netflix content
- A sync-ready structure for play/pause/seek
- Clear documentation of what's possible without a Netflix API

---

## 📚 References

- [HEARO App (Google Play)](https://play.google.com/store/apps/details?id=live.hearo) – Watch party app with Netflix support
- [Netflix Sync Party (Chrome)](https://chromewebstore.google.com/detail/netflix-sync-party/iglgjeoppncgpbbaildpifdnncgbpofl) – Browser extension sync model
- Netflix deep links: `https://www.netflix.com/watch/{videoId}`

---

*This example provides a Netflix room flow that mimics HEARO's authentication pattern within Netflix's constraints.*
