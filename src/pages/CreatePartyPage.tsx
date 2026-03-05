import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useParties } from '@/hooks/useParties';
import { ArrowLeft, ArrowRight, Film, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

const STREAMING_SERVICES = [
  { id: 'youtube', name: 'YouTube', icon: '📹' },
  { id: 'netflix', name: 'Netflix', icon: '🎬' },
  { id: 'disney', name: 'Disney+', icon: '⭐' },
  { id: 'prime', name: 'Prime Video', icon: '▶️' },
  { id: 'hbo', name: 'HBO Max', icon: '📺' },
  { id: 'hulu', name: 'Hulu', icon: '🎞️' },
];

interface CreatePartyPageProps {
  onPartyCreated: (party: import('@/hooks/useParties').Party) => void;
  onNavigate: (page: string) => void;
}

export function CreatePartyPage({ onPartyCreated, onNavigate }: CreatePartyPageProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const { user, displayName } = useAuth();
  const { createParty, loading } = useParties();

  const handleCreate = async () => {
    if (!user) {
      toast.error('Please sign in to create a party');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter a party name');
      return;
    }

    const party = await createParty({
      name: name.trim(),
      description: description.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      videoTitle: videoTitle.trim() || undefined,
      videoSource: service,
      hostId: user.id,
      hostName: displayName,
    });

    if (party) {
      toast.success('Party created! Share the code with friends.');
      onPartyCreated(party);
    } else {
      toast.error('Failed to create party');
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-surface'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PartyPopper className="h-5 w-5" /> Party details
              </CardTitle>
              <CardDescription>Name your party and add a description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Party name</label>
                <Input
                  placeholder="e.g. Friday Movie Night"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Input
                  placeholder="What are you watching?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" /> What to watch
              </CardTitle>
              <CardDescription>Choose a service and add your video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Streaming service</label>
                <div className="grid grid-cols-3 gap-2">
                  {STREAMING_SERVICES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setService(s.id)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        service === s.id
                          ? 'border-primary bg-primary/20'
                          : 'border-border hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{s.icon}</span>
                      <span className="text-xs">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Video URL (optional)</label>
                <Input
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Video title (optional)</label>
                <Input
                  placeholder="e.g. Our favorite show"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to launch</CardTitle>
              <CardDescription>Review and create your party</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-surface/50 space-y-2">
                <p><strong>Name:</strong> {name}</p>
                {description && <p><strong>Description:</strong> {description}</p>}
                <p><strong>Service:</strong> {STREAMING_SERVICES.find(s => s.id === service)?.name}</p>
                {videoTitle && <p><strong>Video:</strong> {videoTitle}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Party'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
