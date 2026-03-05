import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { PartyCard } from '@/components/party/PartyCard';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { STREAMING_SERVICES, getServiceConfig } from '@/lib/constants';
import { AuthModal } from '@/components/auth/AuthModal';
import type { StreamingService } from '@/types';

export function DiscoverPage() {
  const { user } = useAuthStore();
  const { getPublicParties, getMyParties, getFilteredParties } = usePartyStore();
  const [activeTab, setActiveTab] = useState('available');
  const [serviceFilter, setServiceFilter] = useState<StreamingService | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  const connectedServices = useMemo(
    () => user?.connectedServices.filter((s) => s.connected).map((s) => s.service) || [],
    [user?.connectedServices]
  );

  const allPublic = getPublicParties();
  const myParties = getMyParties();

  const availableParties = useMemo(() => {
    if (connectedServices.length === 0) return allPublic;
    return getFilteredParties(connectedServices);
  }, [connectedServices, allPublic, getFilteredParties]);

  const displayedParties = useMemo(() => {
    let parties = activeTab === 'available'
      ? availableParties
      : activeTab === 'all'
        ? allPublic
        : myParties;

    if (serviceFilter !== 'all') {
      parties = parties.filter((p) => p.service === serviceFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      parties = parties.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.contentTitle.toLowerCase().includes(q) ||
          p.hostDisplayName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return parties;
  }, [activeTab, availableParties, allPublic, myParties, serviceFilter, searchQuery]);

  const tabs = [
    { id: 'available', label: 'For You', count: availableParties.length },
    { id: 'all', label: 'All Public', count: allPublic.length },
    { id: 'mine', label: 'My Parties', count: myParties.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Discover Parties</h1>
        <p className="text-white/50 mt-2">
          {user
            ? `Showing parties for your ${connectedServices.length} connected service${connectedServices.length !== 1 ? 's' : ''}`
            : 'Sign in and connect services to see parties you can join'}
        </p>
      </div>

      {!user && (
        <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-300">Sign in to join parties</p>
              <p className="text-sm text-white/50 mt-1">
                Connect your streaming services and join matching watch parties
              </p>
            </div>
            <Button onClick={() => setShowAuth(true)} size="sm">
              Sign In
            </Button>
          </div>
        </div>
      )}

      {user && connectedServices.length === 0 && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-300">No services connected</p>
              <p className="text-sm text-white/50 mt-1">
                Connect at least one streaming service on your{' '}
                <a href="/profile" className="text-purple-400 hover:text-purple-300">profile page</a>{' '}
                to join watch parties
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-8">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parties, content, hosts, tags..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setServiceFilter('all')}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                serviceFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {STREAMING_SERVICES.map((s) => {
              const isConnected = connectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setServiceFilter(serviceFilter === s.id ? 'all' : s.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    serviceFilter === s.id
                      ? 'bg-purple-600 text-white'
                      : isConnected
                        ? 'bg-white/10 text-white/80 hover:bg-white/15'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {s.icon} {s.name}
                  {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {displayedParties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedParties.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">No parties found</h3>
          <p className="text-white/50 mb-6">
            {activeTab === 'available' && connectedServices.length === 0
              ? 'Connect streaming services to see available parties'
              : activeTab === 'mine'
                ? "You haven't joined any parties yet"
                : 'Be the first to create a watch party!'}
          </p>
          <Button onClick={() => window.location.href = '/create'}>
            Create a Party
          </Button>
        </div>
      )}

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
