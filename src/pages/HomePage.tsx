import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { PartyCard } from '@/components/party/PartyCard';
import { STREAMING_SERVICES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';

export function HomePage() {
  const { user } = useAuthStore();
  const { getPublicParties } = usePartyStore();
  const [showAuth, setShowAuth] = useState(false);

  const publicParties = getPublicParties().slice(0, 6);
  const connectedCount = user?.connectedServices.filter((s) => s.connected).length || 0;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-pink-900/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {publicParties.length} parties live now
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Watch Together,
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Stay Connected
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Create private or public watch parties with friends. Real-time sync across
              10 streaming services. Join lobbies based on shared subscriptions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <>
                  <Link to="/create">
                    <Button size="lg">Create a Party</Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="secondary" size="lg">Browse Public Lobbies</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => setShowAuth(true)}>
                    Get Started Free
                  </Button>
                  <Link to="/discover">
                    <Button variant="secondary" size="lg">Explore Parties</Button>
                  </Link>
                </>
              )}
            </div>

            {user && connectedCount > 0 && (
              <p className="text-sm text-white/40">
                You have {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected —{' '}
                <Link to="/profile" className="text-purple-400 hover:text-purple-300">
                  manage connections
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-white/50">Three simple steps to start watching together</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Connect Services',
              desc: 'Link your streaming accounts. We support Netflix, YouTube, Spotify, and 7 more services.',
              icon: '🔗',
            },
            {
              step: '02',
              title: 'Create or Join',
              desc: 'Create a watch party or browse public lobbies. Only join parties for services you have connected.',
              icon: '🎉',
            },
            {
              step: '03',
              title: 'Watch & Chat',
              desc: 'Enjoy perfectly synced playback with friends. Chat in real-time while you watch.',
              icon: '💬',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 group"
            >
              <div className="absolute -top-3 -left-1 text-5xl font-black text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                {item.step}
              </div>
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Supported Services</h2>
          <p className="text-white/50">Connect any of these to start watching</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {STREAMING_SERVICES.map((service) => (
            <div
              key={service.id}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{service.icon}</span>
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {service.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {publicParties.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">Live Parties</h2>
              <p className="text-white/50 mt-1">Jump into a public watch party</p>
            </div>
            <Link to="/discover">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'Active Parties', value: publicParties.length.toString(), icon: '🎬' },
            { label: 'Services', value: '10', icon: '📺' },
            { label: 'Max Party Size', value: '50', icon: '👥' },
            { label: 'Price', value: 'Free', icon: '✨' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
