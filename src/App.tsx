import { useState } from 'react';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { SignInModal } from '@/components/features/SignInModal';
import { HomePage } from '@/pages/HomePage';
import { CreatePartyPage } from '@/pages/CreatePartyPage';
import { JoinPartyPage } from '@/pages/JoinPartyPage';
import { WatchPage } from '@/pages/WatchPage';
import { useAuth } from '@/hooks/useAuth';
import type { Party } from '@/hooks/useParties';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'create' | 'join' | 'watch'>('home');
  const [signInOpen, setSignInOpen] = useState(false);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const { user } = useAuth();

  const handlePartyCreated = (party: Party) => {
    setCurrentParty(party);
    setCurrentPage('watch');
  };

  const handlePartyJoined = (party: Party) => {
    setCurrentParty(party);
    setCurrentPage('watch');
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Navbar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p as typeof currentPage)}
        onSignIn={() => setSignInOpen(true)}
      />

      {currentPage === 'home' && (
        <HomePage
          onNavigate={(p) => setCurrentPage(p as typeof currentPage)}
          onSignIn={() => setSignInOpen(true)}
          isAuthenticated={!!user}
        />
      )}
      {currentPage === 'create' && (
        <CreatePartyPage
          onPartyCreated={handlePartyCreated}
          onNavigate={(p) => setCurrentPage(p as typeof currentPage)}
        />
      )}
      {currentPage === 'join' && (
        <JoinPartyPage
          onPartyJoined={handlePartyJoined}
          onNavigate={(p) => setCurrentPage(p as typeof currentPage)}
        />
      )}
      {currentPage === 'watch' && (
        <WatchPage
          party={currentParty}
          onLeave={() => {
            setCurrentParty(null);
            setCurrentPage('home');
          }}
        />
      )}

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
