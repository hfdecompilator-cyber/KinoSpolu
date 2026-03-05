import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { signIn, signUp, error } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let success: boolean;
    if (mode === 'signin') {
      success = signIn(email, password);
    } else {
      success = signUp(username, email, password, displayName);
    }
    if (success) {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setDisplayName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={resetAndClose}>
      <DialogHeader>
        <DialogTitle>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </DialogTitle>
        <p className="text-sm text-white/50 mt-1">
          {mode === 'signin'
            ? 'Sign in to join watch parties with friends'
            : 'Join WatchParty and start watching together'}
        </p>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <Input
              label="Username"
              placeholder="coolwatcher"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Display Name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </>
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-white/50">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </form>
    </Dialog>
  );
}
