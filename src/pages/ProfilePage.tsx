import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { ServiceConnect } from '@/components/auth/ServiceConnect';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { PartyCard } from '@/components/party/PartyCard';
import { AuthModal } from '@/components/auth/AuthModal';
import { formatDistanceToNow } from 'date-fns';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { getMyParties } = usePartyStore();
  const [activeTab, setActiveTab] = useState('services');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h1 className="text-3xl font-bold text-white mb-3">Your Profile</h1>
        <p className="text-white/50 mb-8">Sign in to manage your profile and connected services</p>
        <Button onClick={() => setShowAuth(true)} size="lg">
          Sign In
        </Button>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  const myParties = getMyParties();
  const connectedCount = user.connectedServices.filter((s) => s.connected).length;

  const handleSaveProfile = () => {
    updateProfile({
      displayName: editName || user.displayName,
      bio: editBio,
    });
    setEditing(false);
  };

  const tabs = [
    { id: 'services', label: 'Services', count: connectedCount },
    { id: 'parties', label: 'Parties', count: myParties.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
        <div className="flex items-start gap-6">
          <Avatar userId={user.id} displayName={user.displayName} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
                <p className="text-white/50 text-sm">@{user.username}</p>
                {user.bio && <p className="text-white/60 mt-2 text-sm">{user.bio}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditName(user.displayName);
                  setEditBio(user.bio);
                  setEditing(true);
                }}
              >
                Edit Profile
              </Button>
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <div className="text-lg font-bold text-white">{connectedCount}</div>
                <div className="text-xs text-white/40">Services</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{user.partiesHosted}</div>
                <div className="text-xs text-white/40">Hosted</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{user.partiesJoined}</div>
                <div className="text-xs text-white/40">Joined</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {formatDistanceToNow(new Date(user.createdAt))}
                </div>
                <div className="text-xs text-white/40">Member for</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <Input
            label="Display Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveProfile} size="sm">Save</Button>
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm">Cancel</Button>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {activeTab === 'services' && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <ServiceConnect />
          <div className="mt-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <p className="text-sm text-purple-300 font-medium mb-1">How service connections work</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Connecting a streaming service lets you create and join watch parties for that service.
              Public parties are only visible to users who have the same service connected.
              This ensures everyone in a party can actually watch the content together.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'parties' && (
        <div>
          {myParties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myParties.map((party) => (
                <PartyCard key={party.id} party={party} showJoinButton={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🎬</div>
              <p className="text-white/50">You haven't joined any parties yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Account Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-sm text-white">Email</p>
                <p className="text-xs text-white/40">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-sm text-white">Username</p>
                <p className="text-xs text-white/40">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-white">Account Created</p>
                <p className="text-xs text-white/40">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
