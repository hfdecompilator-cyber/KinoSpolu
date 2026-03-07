import { useState } from 'react';
import { useStore } from '@/stores/store';

export function LandingPage() {
  const { signIn, signUp } = useStore();
  const [step, setStep] = useState<'hero' | 'signin' | 'signup'>('hero');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let ok: boolean;
    if (step === 'signup') {
      if (!name.trim()) { setError('Enter your name'); setLoading(false); return; }
      ok = await signUp(name.trim(), email.trim(), password);
      if (!ok) setError('Email already taken');
    } else {
      ok = await signIn(email.trim(), password);
      if (!ok) setError('Invalid email or password');
    }
    setLoading(false);
  };

  if (step === 'signin' || step === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative w-full max-w-sm fade-up">
          <div className="glass-strong rounded-3xl p-8">
            <button onClick={() => { setStep('hero'); setError(''); }} className="text-white/40 text-sm mb-6 hover:text-white/70 transition-colors">← Back</button>
            <h2 className="text-2xl font-bold text-white mb-1">{step === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-white/40 text-sm mb-8">{step === 'signup' ? 'Sign up to start watching together' : 'Sign in to your account'}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'signup' && (
                <input className="input-glass" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <input className="input-glass" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="input-glass" type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? '...' : step === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-sm text-white/40 mt-6">
              {step === 'signin' ? "Don't have an account? " : 'Already have one? '}
              <button onClick={() => { setStep(step === 'signin' ? 'signup' : 'signin'); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium">
                {step === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[140px]" />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">G</div>
          <span className="font-bold text-white text-lg tracking-tight">GlassSync</span>
        </div>
      </nav>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-white/50 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-ring" />
            Watch parties, simplified
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-[1.1] mb-4 tracking-tight">
            Watch Together.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Effortlessly.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/40 max-w-md mx-auto mb-10 leading-relaxed">
            Paste a link. Share a code. Watch in sync.
            <br className="hidden sm:block" />
            YouTube, Netflix &amp; more — private lobbies.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button onClick={() => setStep('signup')} className="btn-primary text-base px-10 py-4">Get Started</button>
            <button onClick={() => setStep('signin')} className="btn-glass text-base px-8 py-4">Sign In</button>
          </div>
        </div>
        <div className="mt-16 sm:mt-20 w-full max-w-lg">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4 text-left">
              {[
                { icon: '🔗', label: 'Connect', desc: 'Link your streaming services' },
                { icon: '🔒', label: 'Private', desc: 'Invite-only rooms with codes' },
                { icon: '⚡', label: 'Sync', desc: 'Everyone watches together' },
              ].map((f) => (
                <div key={f.label} className="flex-1 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-xs font-semibold text-white/80">{f.label}</div>
                  <div className="text-[10px] text-white/35 mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
