import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  Search, Users, Play, Filter, Radio, Music,
  Film, Gamepad2, Tv, Compass
} from 'lucide-react';

const genres = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'Sci-Fi', label: 'Movies', icon: Film },
  { id: 'Music', label: 'Music', icon: Music },
  { id: 'Anime', label: 'Anime', icon: Tv },
  { id: 'Horror', label: 'Horror', icon: Film },
  { id: 'Documentary', label: 'Docs', icon: Film },
  { id: 'Drama', label: 'Drama', icon: Tv },
];

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');
  const [authOpen, setAuthOpen] = useState(false);
  const { parties } = usePartyStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return parties.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.host_name.toLowerCase().includes(search.toLowerCase()) ||
        p.media_title?.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = activeGenre === 'all' || p.genre === activeGenre;
      return matchesSearch && matchesGenre;
    });
  }, [parties, search, activeGenre]);

  const handleJoin = (partyId: string) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    navigate(`/watch/${partyId}`);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Parties</h1>
          <p className="text-gray-400">Find and join watch parties happening right now</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search parties, hosts, or content..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Genre Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
          {genres.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveGenre(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeGenre === id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No parties found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => { setSearch(''); setActiveGenre('all'); }}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((party, i) => (
              <motion.div
                key={party.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="group glass rounded-2xl overflow-hidden hover:glow transition-all duration-300 cursor-pointer"
                onClick={() => handleJoin(party.id)}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={party.thumbnail}
                    alt={party.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {party.is_live && <Badge variant="live">LIVE</Badge>}
                    {party.genre && <Badge variant="secondary">{party.genre}</Badge>}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold">{party.name}</h3>
                    {party.media_title && (
                      <p className="text-gray-300 text-sm flex items-center gap-1">
                        <Play className="w-3 h-3" /> {party.media_title}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{party.host_name}</span>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Users className="w-3.5 h-3.5" />
                      {party.current_members}/{party.max_members}
                    </span>
                  </div>
                  <Button size="sm" className="gap-1.5">
                    <Play className="w-3 h-3" /> Join
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
