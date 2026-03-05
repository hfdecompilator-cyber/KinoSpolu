import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';

export function Navbar() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isWatchPage = location.pathname.startsWith('/watch/');

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/discover', label: 'Discover' },
    { path: '/create', label: 'Create Party' },
  ];
  if (user) navLinks.push({ path: '/profile', label: 'Profile' });

  return (
    <>
      <nav className={`sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-slate-900/80 ${isWatchPage ? 'h-14 sm:h-16' : 'h-14 sm:h-16'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                W
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                WatchParty
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <Avatar userId={user.id} displayName={user.displayName} size="sm" />
                    <span className="hidden sm:block text-sm text-white/80 max-w-[100px] truncate">{user.displayName}</span>
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                        <Link to="/profile" onClick={() => setShowMenu(false)} className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors">
                          My Profile
                        </Link>
                        <Link to="/discover" onClick={() => setShowMenu(false)} className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors">
                          My Parties
                        </Link>
                        <hr className="border-white/10" />
                        <button onClick={() => { signOut(); setShowMenu(false); }} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button onClick={() => setShowAuth(true)} size="sm">
                  Sign In
                </Button>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5"
              >
                {showMobileMenu ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-14 left-0 right-0 z-30 md:hidden bg-slate-900/98 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'text-white bg-purple-600/20 border border-purple-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
