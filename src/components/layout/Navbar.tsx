import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/auth/AuthModal';
import { NetflixConnectModal } from '@/components/netflix/NetflixConnectModal';
import { CheckCircle2, LogOut, Plus, Users } from 'lucide-react';
import type { User } from '@/types';

interface NavbarProps {
  user: User | null;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string, username: string) => Promise<boolean>;
  onSignOut: () => void;
  onNetflixConnected: (profileName: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  authError: string | null;
}

const NetflixN = () => (
  <span
    className="font-black text-[#E50914] text-xl leading-none"
    style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}
  >
    N
  </span>
);

export function Navbar({
  user,
  onSignIn,
  onSignUp,
  onSignOut,
  onNetflixConnected,
  onCreateRoom,
  onJoinRoom,
  authError,
}: NavbarProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [netflixOpen, setNetflixOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#E50914] flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">WatchParty</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Netflix status badge */}
                  {user.netflixConnected ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E50914]/15 border border-[#E50914]/30"
                    >
                      <NetflixN />
                      <span className="text-xs text-white/80 font-medium">
                        {user.netflixProfileName || 'Connected'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden sm:flex border-[#E50914]/50 text-[#E50914] hover:bg-[#E50914]/10 hover:border-[#E50914] gap-1.5 text-xs"
                      onClick={() => setNetflixOpen(true)}
                    >
                      <NetflixN />
                      Connect Netflix
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white gap-1.5 text-xs"
                    onClick={onJoinRoom}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Join Room
                  </Button>

                  <Button
                    size="sm"
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] gap-1.5 text-xs"
                    onClick={onCreateRoom}
                    disabled={!user.netflixConnected}
                    title={!user.netflixConnected ? 'Connect Netflix first' : undefined}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Room
                  </Button>

                  <div className="flex items-center gap-2 ml-1 pl-2 border-l border-white/10">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[#7c3aed] text-white text-xs font-bold">
                        {(user.username || user.email)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm text-white/80">
                      {user.username || user.email.split('@')[0]}
                    </span>
                    <button
                      onClick={onSignOut}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white text-sm"
                    onClick={() => setAuthOpen(true)}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-sm"
                    onClick={() => setAuthOpen(true)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        error={authError}
      />

      <NetflixConnectModal
        open={netflixOpen}
        onOpenChange={setNetflixOpen}
        onConnected={(profileName) => {
          onNetflixConnected(profileName);
          setNetflixOpen(false);
        }}
      />
    </>
  );
}
