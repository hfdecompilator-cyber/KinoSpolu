import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string, username: string) => Promise<boolean>;
  error: string | null;
}

type AuthMode = 'signin' | 'signup';

export function AuthModal({ open, onOpenChange, onSignIn, onSignUp, error }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !username) {
      setLocalError('Please enter a username.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const success =
      mode === 'signin'
        ? await onSignIn(email, password)
        : await onSignUp(email, password, username);
    setLoading(false);

    if (success) {
      onOpenChange(false);
      setEmail('');
      setPassword('');
      setUsername('');
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setLocalError('');
  };

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#141414] border-[#2a2a2a] text-white p-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#7c3aed] to-[#E50914]" />

        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-white text-lg">WatchParty</span>
            </div>
            <DialogTitle className="text-xl font-bold text-white text-left">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </DialogTitle>
            <DialogDescription className="text-[#a3a3a3] text-left">
              {mode === 'signin'
                ? 'Sign in to create and join Netflix watch rooms.'
                : 'Join WatchParty and start watching Netflix with friends.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="username" className="text-white/80">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="username"
                      placeholder="your_username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#7c3aed]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#7c3aed]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#7c3aed]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {displayError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2"
              >
                {displayError}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-[#7c3aed] font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-[#7c3aed] font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
