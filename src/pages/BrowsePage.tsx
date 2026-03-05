import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetflixStore } from '@/store/netflix-store';
import { useRoomStore } from '@/store/room-store';
import { Loader2, Plus, Users, LogOut, Copy, Check, ArrowRight, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrowsePage() {
  const { selectedProfile, content, loadContent, isAuthenticated, isDemo, logout } = useNetflixStore();
  const { createRoom, joinRoom, isLoading: roomLoading, error: roomError, clearError } = useRoomStore();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<{ id: string; title: string; image: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !selectedProfile) {
      navigate('/');
      return;
    }
    loadContent();
  }, [isAuthenticated, selectedProfile]);

  const handleCreateRoom = async () => {
    const code = await createRoom(selectedTitle?.title, selectedTitle?.image);
    if (code) {
      setCreatedCode(code);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    const success = await joinRoom(joinCode.trim());
    if (success) navigate(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleCopyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToRoom = () => {
    if (createdCode) navigate(`/room/${createdCode}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-black/90 to-transparent px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 111 30" className="h-6 fill-[#E50914]">
            <path d="M105.06 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.03-13.622L94.174 0h5.25l3.03 7.906L105.593 0h5.25l-5.78 14.28zM90.91 0l-.003 23.654c-1.534.094-3.064.156-4.593.25L86.31 0h4.6zM81.22 3.844h-6.093V0H92v3.844h-6.094v20.093c-1.562.063-3.093.157-4.687.22V3.843zM68.75 13.735c2.093-.156 4.218-.375 6.344-.438V0h-4.687v9.78l-5.937-9.78h-5v23.406c1.5-.094 3-.22 4.5-.282V9.373l4.78 4.362zM53.69 0v23.313c3.094-.094 6.218-.313 9.343-.376V19.22h-4.687V13.22h4.687V9.375H58.34V3.75h4.687V0H53.69zM38.59 0l3.937 15.844L46.5 0h5.094L44.87 24.156c-1.532.063-3.032.094-4.563.22L33.53 0h5.06zM24.906 0v3.75h-4.687v15.47h4.687v3.718c-3.125.094-6.25.313-9.375.5V0h9.375zM10.625 0v20.72c-1.563.063-3.094.22-4.625.345V0h4.625zM5.28 0L0 20.844v3.375c3.156-.407 6.312-.72 9.468-.938V20.75H5.78L10.31 0H5.28z" />
          </svg>
          {isDemo && (
            <span className="text-xs bg-[#E50914]/20 text-[#E50914] px-2 py-1 rounded font-medium">
              DEMO MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded overflow-hidden bg-[#E50914]">
              {selectedProfile?.avatar ? (
                <img src={selectedProfile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold flex items-center justify-center h-full">
                  {selectedProfile?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <span className="text-white text-sm hidden md:block">{selectedProfile?.name}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-6 pb-16">
        {/* Hero section */}
        <section className="py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-white text-3xl md:text-5xl font-bold mb-4">
              Watch Together
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Create a room, share the code, and watch Netflix with friends in perfect sync.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <button
                onClick={() => { setSelectedTitle(null); setShowCreateModal(true); setCreatedCode(null); }}
                className="flex-1 bg-[#E50914] hover:bg-[#F6121D] text-white font-semibold py-4 px-6 rounded-md transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create Room
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={6}
                  className="flex-1 bg-[#333] text-white rounded-md px-4 py-4 text-center text-lg font-mono tracking-widest outline-none border border-transparent focus:border-white/30 transition placeholder:text-gray-500 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length < 4 || roomLoading}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-md transition disabled:opacity-50"
                >
                  {roomLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                </button>
              </div>
            </div>

            {roomError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#E87C03] text-sm mt-4"
              >
                {roomError}
                <button onClick={clearError} className="ml-2 underline opacity-75">dismiss</button>
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* Content rows */}
        {content.map((category, catIdx) => (
          <section key={catIdx} className="mb-8">
            <h2 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
              <Tv size={18} className="text-[#E50914]" />
              {category.category}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {category.titles.map((title) => (
                <motion.button
                  key={title.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTitle(title);
                    setShowCreateModal(true);
                    setCreatedCode(null);
                  }}
                  className={`shrink-0 w-40 md:w-48 rounded-md overflow-hidden border-2 transition group ${
                    selectedTitle?.id === title.id ? 'border-[#E50914]' : 'border-transparent hover:border-white/40'
                  }`}
                >
                  <div className="aspect-video bg-[#2F2F2F] relative">
                    <img
                      src={title.image}
                      alt={title.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-[#E50914] rounded-full p-2">
                        <Users size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#181818] p-2 text-left">
                    <p className="text-white text-xs font-medium truncate">{title.title}</p>
                    <p className="text-gray-500 text-xs">
                      {title.year} {title.rating && `· ${title.rating}`}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181818] rounded-xl p-8 max-w-md w-full border border-white/10"
            >
              {createdCode ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E50914]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-[#E50914]" />
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">Room Created!</h2>
                  <p className="text-gray-400 mb-6">Share this code with your friends:</p>

                  <div className="bg-black/50 rounded-lg p-6 mb-6">
                    <p className="text-5xl font-mono font-bold text-white tracking-[0.3em]">
                      {createdCode}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyCode}
                      className="flex-1 bg-[#333] hover:bg-[#444] text-white py-3 rounded-md transition flex items-center justify-center gap-2"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={handleGoToRoom}
                      className="flex-1 bg-[#E50914] hover:bg-[#F6121D] text-white py-3 rounded-md transition flex items-center justify-center gap-2"
                    >
                      Enter Room
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-white text-2xl font-bold mb-2">Create Watch Room</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    {selectedTitle
                      ? `Start a room to watch "${selectedTitle.title}" together.`
                      : 'Create a room and pick what to watch later.'}
                  </p>

                  {selectedTitle && (
                    <div className="flex items-center gap-4 bg-black/30 rounded-lg p-3 mb-6">
                      <img
                        src={selectedTitle.image}
                        alt={selectedTitle.title}
                        className="w-20 h-12 rounded object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div>
                        <p className="text-white font-medium">{selectedTitle.title}</p>
                        <p className="text-gray-500 text-xs">Netflix</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-4 mb-6">
                    <div className="w-10 h-10 rounded overflow-hidden bg-[#E50914] shrink-0">
                      {selectedProfile?.avatar ? (
                        <img src={selectedProfile?.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold flex items-center justify-center h-full">
                          {selectedProfile?.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{selectedProfile?.name}</p>
                      <p className="text-gray-500 text-xs">Room Host</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 bg-[#333] hover:bg-[#444] text-white py-3 rounded-md transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateRoom}
                      disabled={roomLoading}
                      className="flex-1 bg-[#E50914] hover:bg-[#F6121D] text-white py-3 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {roomLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <Plus size={18} />
                          Create
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
