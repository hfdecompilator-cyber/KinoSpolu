import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash, TrendingUp, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { PartyCard } from '@/components/party/PartyCard';
import { JoinPartyModal } from '@/components/party/JoinPartyModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Party } from '@/types';

export function DiscoverPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPublicParties = async () => {
      const { data } = await supabase
        .from('parties')
        .select(`
          *,
          host:profiles!parties_host_id_fkey(id, username, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      setParties((data || []) as unknown as Party[]);
      setLoading(false);
    };

    fetchPublicParties();
  }, []);

  const filtered = parties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Discover Parties</h1>
          <p className="text-white/40">Find and join active watch parties</p>
        </motion.div>

        {/* Search + join by code */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search parties..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
            />
          </div>
          {user && (
            <Button
              onClick={() => setShowJoin(true)}
              variant="outline"
              className="h-11 border-white/10 text-white/70 hover:bg-white/5 gap-2"
            >
              <Hash className="w-4 h-4" />
              Join by Code
            </Button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-white/40">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">{parties.filter(p => p.is_playing).length} live now</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Users className="w-4 h-4" />
            <span className="text-sm">{parties.length} total parties</span>
          </div>
        </div>

        {/* Parties grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg mb-2">{search ? 'No parties found' : 'No active parties'}</p>
            <p className="text-sm">
              {search ? 'Try a different search term' : 'Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((party, i) => (
              <PartyCard
                key={party.id}
                party={party}
                currentUserId={user?.id || ''}
                index={i}
              />
            ))}
          </div>
        )}
      </main>

      {user && (
        <JoinPartyModal
          open={showJoin}
          onClose={() => setShowJoin(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}
