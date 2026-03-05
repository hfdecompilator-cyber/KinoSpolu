import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { STREAMING_SERVICES, PARTY_TAGS, getServiceConfig } from '@/lib/constants';
import { AuthModal } from '@/components/auth/AuthModal';
import type { StreamingService, PartyVisibility, CreatePartyInput } from '@/types';

export function CreatePartyPage() {
  const { user } = useAuthStore();
  const { createParty } = usePartyStore();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState<StreamingService | ''>('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [visibility, setVisibility] = useState<PartyVisibility>('public');
  const [maxMembers, setMaxMembers] = useState(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const connectedServices = user?.connectedServices
    .filter((s) => s.connected)
    .map((s) => s.service) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!service) {
      setError('Please select a streaming service');
      return;
    }
    if (!connectedServices.includes(service)) {
      setError(`You need to connect ${getServiceConfig(service).name} first. Go to your profile to connect it.`);
      return;
    }
    if (!name.trim()) {
      setError('Please enter a party name');
      return;
    }

    const input: CreatePartyInput = {
      name: name.trim(),
      description: description.trim(),
      service,
      contentTitle: contentTitle.trim(),
      contentUrl: contentUrl.trim(),
      visibility,
      maxMembers,
      tags: selectedTags,
    };

    const party = createParty(input);
    if (party) {
      navigate(`/watch/${party.id}`);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    );
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-3">Create a Watch Party</h1>
        <p className="text-white/50 mb-8">Sign in to create and host watch parties</p>
        <Button onClick={() => setShowAuth(true)} size="lg">
          Sign In to Continue
        </Button>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create a Watch Party</h1>
        <p className="text-white/50 mt-2">
          Set up your party and invite friends to watch together
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
          <h2 className="text-lg font-semibold text-white">Streaming Service</h2>
          <p className="text-sm text-white/50 -mt-4">
            Only services you've connected are available.{' '}
            {connectedServices.length === 0 && (
              <a href="/profile" className="text-purple-400 hover:text-purple-300">Connect services →</a>
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {STREAMING_SERVICES.map((s) => {
              const isConnected = connectedServices.includes(s.id);
              const isSelected = service === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isConnected}
                  onClick={() => setService(s.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50'
                      : isConnected
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                        : 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-medium text-white/70">{s.name}</span>
                  {isConnected && <span className="w-2 h-2 rounded-full bg-green-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Party Details</h2>
          <Input
            label="Party Name"
            placeholder="Friday Movie Night"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="What are you watching?"
            placeholder="Inception (2010)"
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
          />
          <Input
            label="Content URL (optional)"
            placeholder="https://..."
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Description</label>
            <textarea
              placeholder="Tell people what your party is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  visibility === 'public'
                    ? 'bg-purple-600/20 border-purple-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-white text-sm">🌐 Public</div>
                <div className="text-xs text-white/50 mt-1">
                  Anyone with a matching service can find and join
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  visibility === 'private'
                    ? 'bg-purple-600/20 border-purple-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-white text-sm">🔒 Private</div>
                <div className="text-xs text-white/50 mt-1">
                  Only people with the invite code can join
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Max Members: {maxMembers}
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>2</span>
              <span>50</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Tags (optional)</h2>
          <p className="text-sm text-white/50">Select up to 5 tags</p>
          <div className="flex flex-wrap gap-2">
            {PARTY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          Create Party
        </Button>
      </form>
    </div>
  );
}
