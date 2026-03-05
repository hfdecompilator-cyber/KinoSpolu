# Netflix “authentication” (what’s possible)

Netflix does **not** provide a public OAuth/login API for third‑party watch‑party apps. Because of that, this project **does not** (and should not) ask for Netflix usernames/passwords or try to programmatically sign in.

What this project implements instead:

- Users sign in to Netflix **normally** on `netflix.com` in their own browser.
- A small **Chrome extension** (in `extension/`) runs on `netflix.com` and connects the Netflix tab to a **room** via WebSocket.
- The extension syncs play/pause/seek by reading and controlling the page’s `<video>` element.

## Run locally

In two terminals:

- `npm run dev:server` (WebSocket sync server on `ws://localhost:8787`)
- `npm run dev` (web app on `http://localhost:8080`)

Or in one terminal:

- `npm run dev:all`

## Load the extension (Chrome)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## Use it

1. In the web app: Create a room → copy **Room code** + **Host key**.
2. Open a Netflix tab and sign in normally.
3. Click the extension icon → paste:
   - WebSocket URL (`ws://localhost:8787`)
   - Room code
   - Host key (only on the host device)
4. Press **Connect**

Now:

- Using Netflix controls (play/pause/seek) will broadcast room updates.
- Room updates will be applied back onto the Netflix player for other linked tabs.

