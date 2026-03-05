import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Play,
  MessageSquare,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

const NetflixLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 111 30" className={className} fill="#E50914">
    <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.031-13.75L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.25V0zm-8.937 26.937c-4.078-.313-8.156-.5-12.297-.5V0h4.687v22.78c2.562.094 5.156.282 7.61.438v3.72zM64.375 10.656v3.595h-6.719V26.5h-4.656V0H64.75v3.625h-7.094v7.031h6.719zm-18.906-7.03h-4.844V27.75c1.563 0 3.156.031 4.719.063L45.469 3.625zM35.875 0h-4.656l-.031 19.625c-2-.313-3.969-.563-5.969-.782V0H20.5v22.594c4.25.532 8.438 1.282 12.563 2.156V0h2.812zm-18.313 22.28C12.218 21.656 6.75 21.28.999 21.28V0H5.62v17.875c3.625.125 7.188.5 10.719 1.063l1.223 3.342z" />
  </svg>
);

const features = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Real Netflix Auth',
    desc: 'Authenticate with your actual Netflix account — no fake login forms.',
    color: 'text-[#E50914]',
    bg: 'bg-[#E50914]/10',
    border: 'border-[#E50914]/20',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Watch Together',
    desc: 'Create private rooms and invite friends with a 6-character code.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Instant Rooms',
    desc: 'Rooms are created in seconds. Share a code and start watching.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Live Chat',
    desc: 'React and chat with friends while watching your favorite shows.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
];

const steps = [
  { n: '1', title: 'Sign up', desc: 'Create a free WatchParty account.' },
  { n: '2', title: 'Connect Netflix', desc: 'Authenticate with your real Netflix account via the official login page.' },
  { n: '3', title: 'Create a room', desc: 'Set up a private room and choose what to watch.' },
  { n: '4', title: 'Invite friends', desc: 'Share your 6-character room code and watch together.' },
];

export function HomePage({ onGetStarted }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7c3aed]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-[#E50914]/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-[#E50914]/40 text-[#E50914] bg-[#E50914]/10 text-xs px-3 py-1"
            >
              Like HEARO — but for the web
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight leading-none"
          >
            Watch{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] to-[#ff6b6b]">
              Netflix
            </span>
            <br />
            with friends
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#a3a3a3] mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Create a room, connect your real Netflix account, and watch together in sync.
            No browser extension needed — just a WatchParty account and Netflix.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-[#E50914] hover:bg-[#B20710] text-white font-bold px-8 gap-2 text-base"
              onClick={onGetStarted}
            >
              <Play className="w-4 h-4" />
              Start Watching Together
            </Button>
            <div className="flex items-center gap-2 text-sm text-[#a3a3a3]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Free · No extension needed · Real Netflix auth
            </div>
          </motion.div>

          {/* Netflix partner display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-3"
          >
            <span className="text-xs text-[#555] uppercase tracking-widest">Works with</span>
            <NetflixLogo className="h-5 w-auto opacity-60" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Everything you need to watch together
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className={`p-5 rounded-xl border ${f.border} ${f.bg} backdrop-blur-sm`}
              >
                <div className={`${f.color} mb-3`}>{f.icon}</div>
                <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">How it works</h2>
          <p className="text-[#a3a3a3] text-center text-sm mb-10">
            Get started in under 2 minutes
          </p>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center shrink-0 font-bold text-white text-sm">
                  {s.n}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{s.title}</p>
                  <p className="text-xs text-[#a3a3a3] mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              className="bg-[#7c3aed] hover:bg-[#6d28d9] font-bold gap-2"
              onClick={onGetStarted}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <p className="text-[#555] text-xs">
          WatchParty is not affiliated with Netflix. Requires a valid Netflix subscription.
        </p>
      </footer>
    </div>
  );
}
