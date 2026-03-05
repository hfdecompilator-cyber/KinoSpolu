import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { CreatePartyPage } from '@/pages/CreatePartyPage';
import { WatchPage } from '@/pages/WatchPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { seedDemoData } from '@/lib/seed';

function AppContent() {
  const { initialize } = useAuthStore();
  const { loadParties } = usePartyStore();

  useEffect(() => {
    seedDemoData();
    initialize();
    loadParties();
  }, [initialize, loadParties]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/create" element={<CreatePartyPage />} />
        <Route path="/watch/:partyId" element={<WatchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
