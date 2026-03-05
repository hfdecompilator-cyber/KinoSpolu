import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { Users, ArrowRight, AlertCircle, Sparkles, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinPartyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const { joinParty } = usePartyStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Users className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Join a Watch Party</h1>
          <p className="text-gray-400 mb-8">Sign in to join watch parties with your friends</p>
          <Button onClick={() => setAuthOpen(true)} size="lg">Sign In to Continue</Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length < 4) {
      setError('Please enter a valid party code');
      return;
    }
    const party = joinParty(code, user!.id, user!.username);
    if (party) {
      toast.success(`Joined "${party.name}"!`);
      navigate(`/watch/${party.id}`);
    } else {
      setError('Party not found or is full. Check the code and try again.');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setError('');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
          <Ticket className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Join a Party</h1>
        <p className="text-gray-400 mb-10">Enter the party code shared by your friend</p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="glass rounded-2xl p-8">
            <label className="text-sm font-medium text-gray-400 mb-4 block">Party Code</label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABCDEF"
              maxLength={6}
              className="w-full text-center text-4xl font-mono font-bold tracking-[0.3em] bg-transparent border-b-2 border-primary/30 focus:border-primary pb-3 text-white placeholder:text-gray-600 outline-none transition-colors"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-3">6-character alphanumeric code</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-400 text-sm justify-center"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={code.length < 4}>
            <Users className="w-5 h-5" />
            Join Party
          </Button>
        </form>

        <div className="mt-10 glass-light rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Don't have a code?{' '}
            <button onClick={() => navigate('/discover')} className="text-primary-light hover:underline">
              Browse public parties
            </button>{' '}
            or{' '}
            <button onClick={() => navigate('/create')} className="text-primary-light hover:underline">
              create your own
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
