import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv2, Play, Users, MessageCircle, Mic, Zap, Shield, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signup');

  const openSignup = () => { setAuthTab('signup'); setAuthOpen(true); };
  const openSignin = () => { setAuthTab('signin'); setAuthOpen(true); };

  const features = [
    {
      icon: <Play className="w-6 h-6 text-violet-400" />,
      title: 'Synchronized Playback',
      desc: 'Host controls the video and everyone watches in perfect sync. No more "3, 2, 1, play!"',
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-blue-400" />,
      title: 'Live Chat',
      desc: 'React to moments in real-time with messages, emojis, and reactions.',
    },
    {
      icon: <Mic className="w-6 h-6 text-green-400" />,
      title: 'Voice Chat',
      desc: 'Talk while you watch using built-in WebRTC voice chat. No extra apps needed.',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Any Video Source',
      desc: 'YouTube, direct MP4 links, and more. Just paste a URL and start watching.',
    },
    {
      icon: <Shield className="w-6 h-6 text-pink-400" />,
      title: 'Private Parties',
      desc: 'Each party gets a unique 6-character code. Only share it with who you want.',
    },
    {
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      title: 'Watch Together',
      desc: 'Invite friends with a simple code. No accounts needed to join a party.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Tv2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Watch<span className="text-violet-400">Party</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/5"
            onClick={openSignin}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={openSignup}
          >
            Get Started Free
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/25 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-sm text-violet-300 font-medium">Watch together, anywhere</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight tracking-tight">
            The best way to
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              watch together
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Create a private watch party in seconds. Sync video, chat live, and voice call —
            all in one place. No downloads required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base font-semibold gap-2"
              onClick={openSignup}
            >
              Start Watching Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white px-8 h-12 text-base"
              onClick={openSignin}
            >
              Sign In
            </Button>
          </div>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
            <div className="bg-[#161b27] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Fake browser chrome */}
              <div className="bg-[#1a2235] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-white/5 rounded-lg h-6 flex items-center px-3">
                  <span className="text-xs text-white/30">watchparty.app/watch/MOVIE-NIGHT</span>
                </div>
              </div>

              {/* Fake app UI */}
              <div className="flex h-64">
                {/* Video area */}
                <div className="flex-1 bg-black flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-blue-900/30" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                      <Play className="w-7 h-7 text-white ml-1" />
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-lg px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-white/70">3 watching now</span>
                    </div>
                  </div>
                </div>
                {/* Chat sidebar */}
                <div className="w-52 bg-[#0f1520] border-l border-white/5 flex flex-col">
                  <div className="p-2 border-b border-white/5 text-xs text-white/40 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live Chat
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {[
                      { name: 'Alex', msg: 'omg this scene!!! 😱', color: 'violet' },
                      { name: 'Sam', msg: 'I KNEW IT WAS HIM 🔥', color: 'blue' },
                      { name: 'Jordan', msg: 'wait wait wait 😂', color: 'green' },
                      { name: 'Riley', msg: 'best movie ever ❤️', color: 'pink' },
                    ].map((m, i) => (
                      <div key={i} className="flex gap-1.5">
                        <div className={`w-4 h-4 rounded-full bg-${m.color}-600 flex items-center justify-center flex-shrink-0`}>
                          <span className="text-[8px] text-white font-bold">{m.name[0]}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-white/60">{m.name} </span>
                          <span className="text-[10px] text-white/50">{m.msg}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
          <p className="text-white/40">Built for the best watch party experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <p className="text-lg text-white/70 mb-2">"Best watch party app I've used. The voice chat works flawlessly."</p>
        <p className="text-sm text-white/30">— Real users, watching together</p>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">Ready to watch together?</h2>
          <p className="text-white/50 mb-6">Create your first party in under 30 seconds.</p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white px-10 h-12 text-base font-semibold"
            onClick={openSignup}
          >
            Get Started — It's Free
          </Button>
        </motion.div>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </div>
  );
}
