import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CreateRoomPage } from '@/pages/CreateRoomPage';
import { RoomPage } from '@/pages/RoomPage';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import type { Room } from '@/types';

type Page = 'home' | 'dashboard' | 'create-room' | 'room';

function App() {
  const { user, loading, error: authError, signIn, signUp, signOut, updateNetflixStatus } = useAuth();
  const { rooms, loading: roomsLoading, error: roomsError, loadRooms, createRoom, joinRoom } =
    useRoom(user?.id || null);

  const [page, setPage] = useState<Page>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Auto-navigate on auth changes
  useEffect(() => {
    if (!loading) {
      if (user && page === 'home') {
        setPage('dashboard');
        loadRooms();
      } else if (!user && (page === 'dashboard' || page === 'create-room' || page === 'room')) {
        setPage('home');
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && page === 'dashboard') {
      loadRooms();
    }
  }, [page, user]);

  const handleGetStarted = () => {
    if (user) {
      setPage('dashboard');
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    const ok = await signIn(email, password);
    if (ok) {
      setAuthModalOpen(false);
      setPage('dashboard');
      await loadRooms();
    }
    return ok;
  };

  const handleSignUp = async (email: string, password: string, username: string) => {
    const ok = await signUp(email, password, username);
    if (ok) {
      setAuthModalOpen(false);
      setPage('dashboard');
    }
    return ok;
  };

  const handleNetflixConnected = (profileName: string) => {
    updateNetflixStatus(true, profileName);
  };

  const handleCreateRoom = async (params: Parameters<typeof createRoom>[0]): Promise<Room | null> => {
    return await createRoom(params);
  };

  const handleJoinRoom = async (code: string): Promise<Room | null> => {
    setJoinError(null);
    const room = await joinRoom(code, user?.username || user?.email?.split('@')[0] || 'Guest');
    if (!room) {
      setJoinError(roomsError || 'Room not found.');
    } else {
      setCurrentRoom(room);
      setPage('room');
    }
    return room;
  };

  const handleEnterRoom = (room: Room) => {
    setCurrentRoom(room);
    setPage('room');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setPage('dashboard');
    loadRooms();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Full-screen room page (no navbar)
  if (page === 'room' && currentRoom && user) {
    return (
      <>
        <RoomPage room={currentRoom} user={user} onLeave={handleLeaveRoom} />
        <Toaster theme="dark" position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar
        user={user}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSignOut={() => {
          signOut();
          setPage('home');
        }}
        onNetflixConnected={handleNetflixConnected}
        onCreateRoom={() => user?.netflixConnected && setPage('create-room')}
        onJoinRoom={() => setPage('dashboard')}
        authError={authError}
      />

      {page === 'home' && <HomePage onGetStarted={handleGetStarted} />}

      {page === 'dashboard' && user && (
        <DashboardPage
          user={user}
          rooms={rooms}
          loadingRooms={roomsLoading}
          onNetflixConnected={handleNetflixConnected}
          onCreateRoom={() => setPage('create-room')}
          onJoinRoom={handleJoinRoom}
          onEnterRoom={handleEnterRoom}
          joinError={joinError}
        />
      )}

      {page === 'create-room' && user && (
        <CreateRoomPage
          user={user}
          onCreateRoom={handleCreateRoom}
          onBack={() => setPage('dashboard')}
          onRoomCreated={(room) => {
            setCurrentRoom(room);
            setPage('room');
          }}
        />
      )}

      {/* Auth modal for home page "Get Started" */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        error={authError}
      />

      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

export default App;
