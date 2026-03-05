import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  Play, Users, Plus, Zap, MessageCircle, Headphones,
  ArrowRight, Radio, Globe, Shield, Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { parties, fetchParties } = usePartyStore();
  const { isAuthenticated } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchParties();
  }, []);

  const featured = parties.filter((p) => p.is_live).slice(0, 3);

  const handleAction = (path: string) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    navigate(path);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Hero */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-float" />
            <div className="absolute top-1/3 -right-32 w-80 h-80 bg-pink-600/15 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-600/10 rounded-full blur-[128px] animate-float" style={{ animationDelay: '4s' }} />
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 px-4 py-1.5 text-sm" variant="default">
                <Radio className="w-3 h-3 mr-1.5 animate-pulse" />
                Live Watch Parties
              </Badge>
              <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
                <span className="gradient-text">Watch Together,</span>
                <br />
                <span className="text-white">Stay Connected</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Create private watch parties with friends. Real-time sync,
                live chat, and voice chat. Watch movies and shows together from anywhere.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={() => handleAction('/create')} className="gap-2 text-base px-8">
                  <Plus className="w-5 h-5" />
                  Create Party
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAction('/join')} className="gap-2 text-base px-8">
                  <Users className="w-5 h-5" />
                  Join Party
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              {[
                { value: '10K+', label: 'Parties' },
                { value: '50K+', label: 'Users' },
                { value: '1M+', label: 'Messages' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Live Right Now</h2>
                <p className="text-gray-400">Jump into a party happening right now</p>
              </div>
              <Link to="/discover">
                <Button variant="ghost" className="gap-2">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((party, i) => (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="group glass rounded-2xl overflow-hidden hover:glow transition-all duration-300 cursor-pointer"
                  onClick={() => handleAction(`/watch/${party.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={party.thumbnail}
                      alt={party.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="live">LIVE</Badge>
                      {party.genre && <Badge variant="secondary">{party.genre}</Badge>}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-lg">{party.name}</h3>
                      <p className="text-gray-300 text-sm">Hosted by {party.host_name}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Users className="w-4 h-4" />
                      {party.current_members}/{party.max_members}
                    </div>
                    <Button size="sm" className="gap-1.5">
                      <Play className="w-3 h-3" /> Join
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Start watching together in seconds</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Plus, title: 'Create a Party', desc: 'Set up your watch party in seconds. Choose what to watch and customize your room.', color: 'from-purple-500 to-violet-600' },
                { icon: Users, title: 'Invite Friends', desc: 'Share a party code or link. Friends join instantly with one click.', color: 'from-pink-500 to-rose-600' },
                { icon: Headphones, title: 'Watch & Chat', desc: 'Enjoy synchronized playback with live chat and crystal-clear voice chat.', color: 'from-cyan-500 to-blue-600' },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * i }}
                  className="glass rounded-2xl p-8 text-center group hover:glow transition-all duration-300"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
              <p className="text-gray-400">Premium features, completely free</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: 'Real-time Sync', desc: 'Perfect synchronization across all viewers' },
                { icon: MessageCircle, title: 'Live Chat', desc: 'Chat in real-time with everyone in the party' },
                { icon: Headphones, title: 'Voice Chat', desc: 'Crystal clear voice with everyone in the room' },
                { icon: Shield, title: 'Private Rooms', desc: 'Password-protected rooms for privacy' },
                { icon: Globe, title: 'Any Platform', desc: 'Works on desktop, tablet, and mobile' },
                { icon: Radio, title: 'Live Streaming', desc: 'Stream content live for your audience' },
                { icon: Sparkles, title: 'Reactions', desc: 'React with emojis and effects in real-time' },
                { icon: Users, title: 'Up to 100', desc: 'Large parties with up to 100 members' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="glass-light rounded-xl p-5 hover:bg-white/5 transition-colors"
                >
                  <feat.icon className="w-8 h-8 text-primary-light mb-3" />
                  <h4 className="font-semibold text-white mb-1">{feat.title}</h4>
                  <p className="text-sm text-gray-500">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="gradient-primary rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Watch Together?</h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  Create your first party in seconds. No downloads, no hassle.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleAction('/create')}
                  className="bg-white text-purple-700 hover:bg-gray-100 gap-2 text-base px-8"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">WatchParty</span>
            </div>
            <p className="text-sm text-gray-500">&copy; 2026 WatchParty. Watch together, stay connected.</p>
          </div>
        </footer>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
