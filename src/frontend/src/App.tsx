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
import { CustomSongRequestsScreen } from './pages/CustomSongRequestsScreen';
import { ContactScreen } from './pages/ContactScreen';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import { Toaster } from '@/components/ui/sonner';
import { parseSongIdFromUrl, clearSongParamFromUrl } from './utils/deepLinks';

export type Screen = 'home' | 'songs' | 'library' | 'search' | 'about' | 'themes' | 'settings' | 'support' | 'requests' | 'contact';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [deepLinkSongId, setDeepLinkSongId] = useState<bigint | null>(null);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  // Handle deep link on app load
  useEffect(() => {
    const songId = parseSongIdFromUrl();
    if (songId && !deepLinkHandled) {
      setDeepLinkSongId(songId);
      setCurrentScreen('songs');
    }
  }, [deepLinkHandled]);

  const handleDeepLinkHandled = () => {
    setDeepLinkHandled(true);
    clearSongParamFromUrl();
    setDeepLinkSongId(null);
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
        return <LibraryScreen />;
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
      case 'requests':
        return <CustomSongRequestsScreen />;
      case 'contact':
        return <ContactScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppShell currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          {renderScreen()}
        </AppShell>
        <Toaster />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
