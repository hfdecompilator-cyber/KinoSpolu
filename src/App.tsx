import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            WatchParty
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link to="/discover" className="text-white/80 hover:text-white transition-colors">Discover</Link>
            <Link to="/create" className="text-white/80 hover:text-white transition-colors">Create Party</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Watch Together, Stay Connected
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Create private watch parties with friends. Real-time sync, voice chat, and video chat.
            Watch movies and shows together from anywhere.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/create"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors"
            >
              Create a Party
            </Link>
            <Link
              to="/discover"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold backdrop-blur-sm transition-colors"
            >
              Browse Parties
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { title: "10 Services", desc: "Netflix, YouTube, Spotify, Twitch, and more", icon: "🎬" },
            { title: "Real-time Sync", desc: "Everyone watches in perfect sync", icon: "⚡" },
            { title: "Voice & Video Chat", desc: "Talk while you watch together", icon: "🎙️" },
          ].map((feature) => (
            <div key={feature.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function DiscoverPage() {
  const parties = [
    { id: 1, title: "Movie Night: Inception", host: "Alex", viewers: 5, service: "Netflix" },
    { id: 2, title: "Music Session", host: "Jordan", viewers: 3, service: "Spotify" },
    { id: 3, title: "Gaming Stream", host: "Sam", viewers: 12, service: "Twitch" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            WatchParty
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link to="/discover" className="text-white hover:text-white transition-colors font-semibold">Discover</Link>
            <Link to="/create" className="text-white/80 hover:text-white transition-colors">Create Party</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Discover Parties</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party) => (
            <div key={party.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">{party.service}</span>
                <span className="text-white/50 text-sm">{party.viewers} watching</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{party.title}</h3>
              <p className="text-white/60">Hosted by {party.host}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function CreatePartyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            WatchParty
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link to="/discover" className="text-white/80 hover:text-white transition-colors">Discover</Link>
            <Link to="/create" className="text-white hover:text-white transition-colors font-semibold">Create Party</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Create a Watch Party</h1>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Party created!"); }}>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Party Name</label>
            <input
              type="text"
              placeholder="Movie Night with Friends"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Streaming Service</label>
            <select className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="netflix">Netflix</option>
              <option value="youtube">YouTube</option>
              <option value="spotify">Spotify</option>
              <option value="twitch">Twitch</option>
              <option value="prime">Prime Video</option>
              <option value="disney">Disney+</option>
              <option value="hbo">HBO Max</option>
              <option value="apple">Apple TV+</option>
              <option value="hulu">Hulu</option>
              <option value="paramount">Paramount+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
            <textarea
              placeholder="What are we watching?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors"
          >
            Create Party
          </button>
        </form>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/create" element={<CreatePartyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
