import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetflixStore } from '@/store/netflix-store';
import { Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const FALLBACK_COLORS = ['#E50914', '#1CE783', '#00A8E1', '#E89C28', '#7B2FF7', '#F25C78'];

export default function ProfilesPage() {
  const { profiles, loadProfiles, selectProfile, isLoading, isAuthenticated } = useNetflixStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadProfiles();
  }, [isAuthenticated]);

  const handleSelect = async (profile: typeof profiles[0]) => {
    await selectProfile(profile);
    navigate('/browse');
  };

  if (isLoading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#E50914] mx-auto mb-4" size={40} />
          <p className="text-gray-400">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-white text-4xl md:text-5xl font-medium mb-10">Who's watching?</h1>

        <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
          {profiles.map((profile, idx) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelect(profile)}
              className="group text-center"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-md overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-200 group-hover:scale-105">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.style.backgroundColor = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                      target.parentElement!.innerHTML = `<span class="text-4xl font-bold text-white flex items-center justify-center h-full">${profile.name.charAt(0).toUpperCase()}</span>`;
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
                  >
                    <span className="text-4xl font-bold text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-400 group-hover:text-white mt-3 text-base md:text-lg transition">
                {profile.name}
              </p>
            </motion.button>
          ))}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-12 text-gray-500 hover:text-white text-sm border border-gray-600 hover:border-white px-6 py-2 transition"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
