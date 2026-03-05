/**
 * Create Netflix Room - HEARO-Style Authentication Example
 *
 * This component demonstrates creating a Netflix watch party room with
 * authentication flow similar to the HEARO Android app.
 *
 * Key points:
 * - Netflix has NO public OAuth/API - we use "Connect Netflix" step
 * - "Connect" = open netflix.com for user to log in (we can't capture session)
 * - Room syncs play/pause/seek; each user watches in their own Netflix
 * - Uses Netflix deep links: https://www.netflix.com/watch/{videoId}
 */

import React, { useState } from 'react';

const NETFLIX_CONNECT_KEY = 'netflix_connected';
const NETFLIX_LOGIN_URL = 'https://www.netflix.com/login';

// Netflix content URLs - videoId examples (these are real Netflix IDs)
const NETFLIX_CONTENT_EXAMPLES = [
  { id: '80217447', title: 'Stranger Things', type: 'series' },
  { id: '70242311', title: 'The Sandman', type: 'series' },
  { id: '80117401', title: 'Wednesday', type: 'series' },
  { id: '70300800', title: 'Breaking Bad', type: 'series' },
  { id: '81256178', title: 'Squid Game', type: 'series' },
];

export function CreateNetflixRoomExample() {
  const [step, setStep] = useState<'connect' | 'create' | 'ready'>('connect');
  const [netflixConnected, setNetflixConnected] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(NETFLIX_CONNECT_KEY) === 'true' : false
  );
  const [roomName, setRoomName] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [customVideoId, setCustomVideoId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleConnectNetflix = () => {
    // HEARO-style: Open Netflix for user to log in
    // We cannot capture the session - Netflix doesn't allow it
    // User must manually return and confirm
    window.open(NETFLIX_LOGIN_URL, '_blank', 'noopener,noreferrer');
    // Show confirmation step
    setStep('connect');
  };

  const handleConfirmConnected = () => {
    localStorage.setItem(NETFLIX_CONNECT_KEY, 'true');
    setNetflixConnected(true);
    setStep('create');
  };

  const handleCreateRoom = () => {
    setError('');
    const videoId = selectedVideo?.id || customVideoId.trim();
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    if (!videoId) {
      setError('Please select a show or enter a Netflix video ID');
      return;
    }

    // In production: call your API to create room in DB
    // const response = await api.createRoom({ service: 'netflix', videoId, name: roomName });
    const code = 'NFX-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoomCode(code);
    setStep('ready');
  };

  const getNetflixWatchUrl = (videoId: string) =>
    `https://www.netflix.com/watch/${videoId}`;

  const openNetflixContent = () => {
    const videoId = selectedVideo?.id || customVideoId.trim();
    if (videoId) {
      window.open(getNetflixWatchUrl(videoId), '_blank');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-slate-900/80 backdrop-blur rounded-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-2">
        Create Netflix Room
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        HEARO-style flow: Connect Netflix → Create room → Share & sync
      </p>

      {/* Step 1: Connect Netflix (HEARO authentication step) */}
      {step === 'connect' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-red-900/30">
            <div className="w-12 h-12 rounded-lg bg-[#E50914] flex items-center justify-center text-white font-bold">
              N
            </div>
            <div>
              <h3 className="font-semibold text-white">Connect Netflix</h3>
              <p className="text-sm text-slate-400">
                Open Netflix and log in to your account. We can&apos;t access your credentials
                (Netflix doesn&apos;t allow it) – you just need to be logged in.
              </p>
            </div>
          </div>

          {!netflixConnected ? (
            <>
              <button
                onClick={handleConnectNetflix}
                className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f40612] text-white font-semibold transition"
              >
                Open Netflix to Log In
              </button>
              <button
                onClick={handleConfirmConnected}
                className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium border border-slate-600"
              >
                I&apos;ve logged in – Continue
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep('create')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Netflix Connected ✓ – Create Room
            </button>
          )}
        </div>
      )}

      {/* Step 2: Create room */}
      {step === 'create' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Room name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Movie Night with Friends"
              className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What to watch
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {NETFLIX_CONTENT_EXAMPLES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedVideo({ id: item.id, title: item.title });
                    setCustomVideoId('');
                  }}
                  className={`p-3 rounded-xl text-left border transition ${
                    selectedVideo?.id === item.id
                      ? 'bg-red-900/30 border-[#E50914] text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-slate-500 block">{item.id}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customVideoId}
              onChange={(e) => {
                setCustomVideoId(e.target.value);
                setSelectedVideo(null);
              }}
              placeholder="Or paste Netflix video ID (e.g. 70242311)"
              className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-red-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('connect')}
              className="py-2 px-4 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              Back
            </button>
            <button
              onClick={handleCreateRoom}
              className="flex-1 py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f40612] text-white font-semibold"
            >
              Create Room
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Room ready - share */}
      {step === 'ready' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
            <p className="text-emerald-400 font-medium">Room created!</p>
            <p className="text-slate-400 text-sm mt-1">
              Share this code so friends can join. They must also connect Netflix.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800 border border-slate-600">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Room code
            </p>
            <p className="text-2xl font-mono font-bold text-white tracking-wider">
              {roomCode}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(roomCode)}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Copy code
            </button>
          </div>

          <button
            onClick={openNetflixContent}
            className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f40612] text-white font-semibold"
          >
            Open in Netflix →
          </button>

          <p className="text-xs text-slate-500">
            Each participant opens Netflix (app or browser) and watches there.
            Your sync layer broadcasts play/pause/seek to keep everyone in sync.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Helper: Extract Netflix videoId from URL
 * Use when user pastes a Netflix link
 */
export function extractNetflixVideoId(url: string): string | null {
  const match = url.match(/netflix\.com\/(?:watch|title)\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Netflix watch URL for deep linking (opens in Netflix app on mobile)
 */
export function getNetflixWatchUrl(videoId: string): string {
  return `https://www.netflix.com/watch/${videoId}`;
}
