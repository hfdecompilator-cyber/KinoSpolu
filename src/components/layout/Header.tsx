import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv2, Plus, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  onCreateParty?: () => void;
}

export function Header({ onCreateParty }: HeaderProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to={user ? '/home' : '/'} className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center glow-purple-sm"
              >
                <Tv2 className="w-4.5 h-4.5 text-white" />
              </motion.div>
              <span className="text-lg font-bold text-white">
                Watch<span className="text-violet-400">Party</span>
              </span>
            </Link>

            {/* Nav links - desktop */}
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/home" className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                  Home
                </Link>
                <Link to="/discover" className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                  Discover
                </Link>
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {onCreateParty && (
                    <Button
                      size="sm"
                      onClick={onCreateParty}
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-9"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Party</span>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors group">
                        <Avatar className="w-8 h-8 ring-2 ring-violet-500/30">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">
                            {getInitials(profile?.username || user.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm text-white/70 group-hover:text-white max-w-24 truncate">
                          {profile?.username || user.email}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden sm:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-[#1a2235] border-white/10 text-white"
                    >
                      <DropdownMenuItem className="gap-2 hover:bg-white/5 focus:bg-white/5">
                        <User className="w-4 h-4 text-white/50" />
                        <span className="truncate">{profile?.username || 'Profile'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 hover:bg-white/5 focus:bg-white/5">
                        <Settings className="w-4 h-4 text-white/50" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="gap-2 text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/5"
                    onClick={() => { setAuthTab('signin'); setAuthOpen(true); }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => { setAuthTab('signup'); setAuthOpen(true); }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
