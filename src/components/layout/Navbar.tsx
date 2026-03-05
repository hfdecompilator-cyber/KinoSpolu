import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Film, Home, Plus, LogIn, User, LogOut } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSignIn: () => void;
}

export function Navbar({ currentPage, onNavigate, onSignIn }: NavbarProps) {
  const { user, displayName, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 font-bold text-xl hover:opacity-80"
          >
            <Film className="h-6 w-6 text-primary" />
            WatchParty
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant={currentPage === 'home' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('home')}
            >
              <Home className="h-4 w-4 mr-1" /> Home
            </Button>
            <Button
              variant={currentPage === 'create' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('create')}
            >
              <Plus className="h-4 w-4 mr-1" /> Create
            </Button>
            <Button
              variant={currentPage === 'join' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('join')}
            >
              <LogIn className="h-4 w-4 mr-1" /> Join
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 hidden sm:inline">
                  {displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={onSignIn}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
