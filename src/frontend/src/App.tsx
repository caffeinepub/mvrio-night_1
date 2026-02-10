import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './pages/HomeScreen';
import { SongsScreen } from './pages/SongsScreen';
import { LibraryScreen } from './pages/LibraryScreen';
import { SearchScreen } from './pages/SearchScreen';
import { AboutArtistScreen } from './pages/AboutArtistScreen';
import { ThemesScreen } from './pages/ThemesScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { SupportScreen } from './pages/SupportScreen';
import { ContactScreen } from './pages/ContactScreen';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import { AuthProvider } from './context/AuthContext';
import { HiddenAdminModeProvider } from './context/HiddenAdminModeContext';
import { AdminProvider } from './context/AdminContext';
import { AdminPasscodeModal } from './components/admin/AdminPasscodeModal';
import { UnifiedMessagesDrawer } from './components/messaging/UnifiedMessagesDrawer';
import { ProfileCompletionModal } from './components/account/ProfileCompletionModal';
import { Toaster } from '@/components/ui/sonner';
import { parseSongIdFromUrl, clearSongParamFromUrl, parsePlaylistFromUrl, clearPlaylistParamFromUrl } from './utils/deepLinks';
import { useFirstLaunchWelcome } from './hooks/useFirstLaunchWelcome';
import { FirstLaunchWelcomePopup } from './components/onboarding/FirstLaunchWelcomePopup';
import { SignInModal } from './components/SignInModal';
import { usePendingAction } from './hooks/usePendingAction';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useProfileHelpers } from './hooks/useUserProfile';
import { useAuth } from './context/AuthContext';
import { toast } from 'sonner';

export type Screen = 'home' | 'songs' | 'library' | 'search' | 'about' | 'themes' | 'settings' | 'support' | 'contact';

type PlaylistDeepLink = {
  name: string;
  type: 'user' | 'official';
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [deepLinkSongId, setDeepLinkSongId] = useState<bigint | null>(null);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [deepLinkPlaylist, setDeepLinkPlaylist] = useState<PlaylistDeepLink | null>(null);
  const [playlistDeepLinkHandled, setPlaylistDeepLinkHandled] = useState(false);
  const { isWelcomeOpen, dismissWelcome } = useFirstLaunchWelcome();
  const { identity } = useInternetIdentity();
  const { isProfileComplete, isLoading: profileLoading, isFetched: profileFetched } = useProfileHelpers();
  const { requireAuth } = useAuth();
  
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [messagePrefill, setMessagePrefill] = useState<string | undefined>(undefined);

  usePendingAction();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && !isProfileComplete;

  // Handle song deep links
  useEffect(() => {
    const songId = parseSongIdFromUrl();
    if (songId && !deepLinkHandled) {
      setDeepLinkSongId(songId);
      setCurrentScreen('songs');
    }
  }, [deepLinkHandled]);

  // Handle playlist deep links
  useEffect(() => {
    const playlist = parsePlaylistFromUrl();
    if (playlist && !playlistDeepLinkHandled) {
      setDeepLinkPlaylist(playlist);
      setCurrentScreen('library');
    }
  }, [playlistDeepLinkHandled]);

  const handleDeepLinkHandled = () => {
    setDeepLinkHandled(true);
    clearSongParamFromUrl();
    setDeepLinkSongId(null);
  };

  const handlePlaylistDeepLinkHandled = () => {
    setPlaylistDeepLinkHandled(true);
    clearPlaylistParamFromUrl();
    setDeepLinkPlaylist(null);
  };

  const handleOpenMessages = (prefill?: string) => {
    if (!isAuthenticated) {
      requireAuth({ type: 'messaging' });
      toast.error('Please sign in to send messages');
      return;
    }

    if (!isProfileComplete) {
      toast.error('Please complete your profile to send messages');
      return;
    }

    setMessagePrefill(prefill);
    setIsMessagesOpen(true);
  };

  const handleCloseMessages = () => {
    setIsMessagesOpen(false);
    setMessagePrefill(undefined);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'songs':
        return (
          <SongsScreen
            initialSongId={deepLinkSongId}
            onDeepLinkHandled={handleDeepLinkHandled}
          />
        );
      case 'library':
        return (
          <LibraryScreen
            initialPlaylistDeepLink={deepLinkPlaylist}
            onPlaylistDeepLinkHandled={handlePlaylistDeepLinkHandled}
          />
        );
      case 'search':
        return <SearchScreen />;
      case 'about':
        return <AboutArtistScreen />;
      case 'themes':
        return <ThemesScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'support':
        return <SupportScreen />;
      case 'contact':
        return <ContactScreen onOpenMessages={handleOpenMessages} />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      {isWelcomeOpen && <FirstLaunchWelcomePopup onDismiss={dismissWelcome} />}
      {showProfileSetup && <ProfileCompletionModal open={true} />}
      <AppShell 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen}
        onOpenMessages={() => handleOpenMessages()}
      >
        {renderScreen()}
      </AppShell>
      <UnifiedMessagesDrawer 
        open={isMessagesOpen} 
        onOpenChange={handleCloseMessages}
        prefillContent={messagePrefill}
      />
      <SignInModal />
      <AdminPasscodeModal />
      <Toaster />
    </>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <HiddenAdminModeProvider>
            <AdminProvider>
              <AppContent />
            </AdminProvider>
          </HiddenAdminModeProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
