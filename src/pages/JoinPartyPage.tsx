import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useParties } from '@/hooks/useParties';
import { ArrowLeft, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface JoinPartyPageProps {
  onPartyJoined: (party: import('@/hooks/useParties').Party) => void;
  onNavigate: (page: string) => void;
}

export function JoinPartyPage({ onPartyJoined, onNavigate }: JoinPartyPageProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const { user, displayName } = useAuth();
  const { joinPartyByCode } = useParties();

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a party code');
      return;
    }

    if (!user) {
      toast.error('Please sign in to join a party');
      return;
    }

    setChecking(true);
    const party = await joinPartyByCode(trimmed, user.id, displayName);
    setChecking(false);

    if (party) {
      toast.success(`Joined ${party.name}!`);
      onPartyJoined(party);
    } else {
      toast.error('Party not found. Check the code and try again.');
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Join a Party
            </CardTitle>
            <CardDescription>
              Enter the 6-character code shared by the host
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Party Code</label>
              <Input
                placeholder="e.g. ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={checking || !user}
            >
              {checking ? 'Joining...' : 'Join Party'}
            </Button>
            {!user && (
              <p className="text-sm text-amber-500 text-center">
                Sign in first to join a party
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
