import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Hash, Users, Tv2, TrendingUp, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { PartyCard } from '@/components/party/PartyCard';
import { CreatePartyModal } from '@/components/party/CreatePartyModal';
import { JoinPartyModal } from '@/components/party/JoinPartyModal';
import { useAuth } from '@/hooks/useAuth';
import { useMyParties } from '@/hooks/useParty';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { user, profile } = useAuth();
  const { parties, loading } = useMyParties(user?.id);

  const username = profile?.username || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header onCreateParty={() => setShowCreate(true)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-white mb-1">
            Hey, {username} 👋
          </h1>
          <p className="text-white/40">What are you watching tonight?</p>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowCreate(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-violet-600/30 to-purple-700/20 border border-violet-500/30 rounded-2xl p-6 text-left hover:border-violet-500/50 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-violet-600/30 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Create a Party</h3>
              <p className="text-sm text-white/50">Host a watch party and invite friends</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowJoin(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-700/10 border border-blue-500/20 rounded-2xl p-6 text-left hover:border-blue-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Join a Party</h3>
              <p className="text-sm text-white/50">Enter a code to join your friends</p>
            </div>
          </motion.button>
        </div>

        {/* My Parties */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tv2 className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">My Parties</h2>
            {parties.length > 0 && (
              <span className="ml-auto text-xs text-white/30">{parties.length} active</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : parties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/2 border border-white/5 rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Tv2 className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm mb-4">No active parties yet</p>
              <div className="flex justify-center gap-3">
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-4 h-4" />
                  Create Party
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white/60 hover:bg-white/5 gap-1.5"
                  onClick={() => setShowJoin(true)}
                >
                  <Hash className="w-4 h-4" />
                  Join Party
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parties.map((party, i) => (
                <PartyCard
                  key={party.id}
                  party={party}
                  currentUserId={user?.id || ''}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {parties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {[
              { icon: <Users className="w-4 h-4" />, label: 'Parties', value: parties.length },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Live now', value: parties.filter(p => p.is_playing).length },
              { icon: <Clock className="w-4 h-4" />, label: 'This week', value: parties.filter(p => {
                const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
                return new Date(p.created_at).getTime() > week;
              }).length },
            ].map(stat => (
              <div key={stat.label} className="bg-white/3 border border-white/5 rounded-xl p-4 text-center">
                <div className="flex justify-center text-white/30 mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/30 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      {user && (
        <>
          <CreatePartyModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            userId={user.id}
          />
          <JoinPartyModal
            open={showJoin}
            onClose={() => setShowJoin(false)}
            userId={user.id}
          />
        </>
      )}
    </div>
  );
}
