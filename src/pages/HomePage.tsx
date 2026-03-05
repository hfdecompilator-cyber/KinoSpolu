import { Button } from '@/components/ui/button';
import { Film, Users, MessageCircle, Zap } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
}

export function HomePage({ onNavigate, onSignIn, isAuthenticated }: HomePageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-purple-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            Watch Together,
            <br />
            <span className="text-primary">Stay Connected</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Create private watch parties with friends. Real-time sync, live chat, and voice.
            Watch movies and shows together from anywhere.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 h-14 rounded-xl"
              onClick={() => onNavigate('create')}
            >
              Create a Party
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 h-14 rounded-xl"
              onClick={() => onNavigate('join')}
            >
              Join with Code
            </Button>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="ghost"
                className="text-lg px-8 h-14"
                onClick={onSignIn}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why WatchParty?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Film,
                title: 'Synced Playback',
                desc: 'Everyone watches in perfect sync. Pause, play, seek together.',
              },
              {
                icon: MessageCircle,
                title: 'Live Chat',
                desc: 'React, comment, and chat in real-time without leaving the screen.',
              },
              {
                icon: Users,
                title: 'Voice Chat',
                desc: 'Talk to your friends like you\'re in the same room.',
              },
              {
                icon: Zap,
                title: 'Instant Join',
                desc: 'Share a code, friends join in seconds. No complicated setup.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-surface/30 border border-border/30 hover:border-primary/30 transition-colors"
              >
                <f.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary/30">
          <h3 className="text-2xl font-bold mb-4">Ready to watch?</h3>
          <p className="text-gray-400 mb-6">Create a party in 3 steps and invite your friends.</p>
          <Button size="lg" onClick={() => onNavigate('create')}>
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
}
