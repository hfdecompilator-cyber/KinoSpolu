import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'choose' | 'magic' | 'password' | 'signup';

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [mode, setMode] = useState<AuthMode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentMagicLink, setSentMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    signInWithMagicLink,
    signInWithGoogle,
    signUpWithEmail,
    signInWithPassword,
    isConfigured,
  } = useAuth();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSentMagicLink(true);
      toast.success('Check your email! We sent you a magic link.');
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      onOpenChange(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to confirm.');
      onOpenChange(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      onOpenChange(false);
    }
  };

  const reset = () => {
    setMode('choose');
    setEmail('');
    setPassword('');
    setSentMagicLink(false);
  };

  const onClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showClose={!loading} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome to WatchParty
          </DialogTitle>
          <DialogDescription>
            Sign in to create parties, chat with friends, and watch together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {mode === 'choose' && (
            <>
              <Button
                onClick={handleGoogle}
                disabled={loading}
                variant="outline"
                className="w-full h-12 text-base gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-gray-500">or</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  onClick={() => setMode('magic')}
                  variant="outline"
                  className="w-full h-12 text-base gap-3"
                >
                  <Mail className="h-5 w-5" />
                  Sign in with Magic Link
                </Button>
                <Button
                  onClick={() => setMode('password')}
                  variant="ghost"
                  className="w-full text-gray-400"
                >
                  Sign in with password
                </Button>
                <p className="text-xs text-center text-gray-500">
                  No account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </>
          )}

          {mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              {sentMagicLink ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-green-400 font-medium">Check your inbox!</p>
                  <p className="text-sm text-gray-400">
                    We sent a magic link to <strong>{email}</strong>. Click it to sign in.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setSentMagicLink(false); setEmail(''); }}
                  >
                    Use different email
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm text-gray-500 hover:text-white"
              >
                ← Back
              </button>
            </form>
          )}

          {mode === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm text-gray-500 hover:text-white"
              >
                ← Back
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm text-gray-500 hover:text-white"
              >
                ← Back
              </button>
            </form>
          )}
        </div>

        {!isConfigured && (
          <p className="text-xs text-center text-amber-500/80 pt-2">
            Demo mode: Configure Supabase for real auth
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
