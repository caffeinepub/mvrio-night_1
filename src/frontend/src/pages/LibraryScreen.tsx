import { useState, useEffect } from 'react';
import { useGetAllSongs, useGetFavorites } from '../hooks/useQueries';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { LibraryTopTabs, type LibraryTab } from '../components/library/LibraryTopTabs';
import { LibraryPlaylistsPanel } from '../components/library/LibraryPlaylistsPanel';
import { PlaylistDetailView } from '../components/library/PlaylistDetailView';
import { SongListRow } from '../components/songs/SongListRow';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import type { SongView } from '../backend';

type PlaylistContext = {
  type: 'user' | 'official';
  name: string;
  songs: SongView[];
};

type PlaylistDeepLink = {
  name: string;
  type: 'user' | 'official';
};

interface LibraryScreenProps {
  initialPlaylistDeepLink?: PlaylistDeepLink | null;
  onPlaylistDeepLinkHandled?: () => void;
}

export function LibraryScreen({ initialPlaylistDeepLink, onPlaylistDeepLinkHandled }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('songs');
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistContext | null>(null);
  const [playlistQueue, setPlaylistQueue] = useState<SongView[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all'>('off');
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  
  const { data: songs, isLoading: songsLoading } = useGetAllSongs();
  const { data: favorites, isLoading: favoritesLoading } = useGetFavorites();
  const { identity } = useInternetIdentity();
  const { requireAuth } = useAuth();
  
  const isAuthenticated = !!identity;
  const currentSong = songs?.find(s => s.id === currentSongId) || null;

  // Handle playlist deep link
  useEffect(() => {
    if (initialPlaylistDeepLink && !deepLinkProcessed) {
      setDeepLinkProcessed(true);
      setActiveTab('playlists');
      
      // Trigger playlist opening via a callback that will be set by LibraryPlaylistsPanel
      // We'll pass the deep link info down and let the panel handle it
    }
  }, [initialPlaylistDeepLink, deepLinkProcessed]);

  const handleNext = () => {
    // If we're in a playlist context, use playlist queue
    if (playlistQueue.length > 0) {
      const currentIndex = playlistQueue.findIndex(s => s.id === currentSongId);
      if (currentIndex === -1) {
        // Start from beginning
        setCurrentSongId(playlistQueue[0].id);
        return;
      }
      
      const nextIndex = currentIndex + 1;
      if (nextIndex < playlistQueue.length) {
        setCurrentSongId(playlistQueue[nextIndex].id);
      } else if (repeatMode === 'all') {
        // Loop back to start
        setCurrentSongId(playlistQueue[0].id);
      }
      return;
    }
    
    // Default behavior: use all songs
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSongId(songs[nextIndex].id);
  };

  const handlePrevious = () => {
    // If we're in a playlist context, use playlist queue
    if (playlistQueue.length > 0) {
      const currentIndex = playlistQueue.findIndex(s => s.id === currentSongId);
      if (currentIndex === -1) {
        // Start from end
        setCurrentSongId(playlistQueue[playlistQueue.length - 1].id);
        return;
      }
      
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        setCurrentSongId(playlistQueue[prevIndex].id);
      } else if (repeatMode === 'all') {
        // Loop to end
        setCurrentSongId(playlistQueue[playlistQueue.length - 1].id);
      }
      return;
    }
    
    // Default behavior: use all songs
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentSongId(songs[prevIndex].id);
  };

  const handleOpenPlaylist = (playlist: PlaylistContext) => {
    setSelectedPlaylist(playlist);
    setPlaylistQueue(playlist.songs);
    setIsShuffled(false);
    setRepeatMode('off');
    
    // Mark deep link as handled if this was triggered by a deep link
    if (initialPlaylistDeepLink && onPlaylistDeepLinkHandled) {
      onPlaylistDeepLinkHandled();
    }
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setPlaylistQueue([]);
    setIsShuffled(false);
    setRepeatMode('off');
  };

  const handlePlaylistPlay = (songs: SongView[]) => {
    if (songs.length === 0) return;
    setCurrentSongId(songs[0].id);
  };

  const handleShuffleToggle = (songs: SongView[]) => {
    const newShuffled = !isShuffled;
    setIsShuffled(newShuffled);
    
    if (newShuffled) {
      // Shuffle the queue
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setPlaylistQueue(shuffled);
    } else {
      // Restore original order
      setPlaylistQueue(songs);
    }
  };

  const handleRepeatToggle = () => {
    setRepeatMode(prev => prev === 'off' ? 'all' : 'off');
  };

  if (songsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get favorite songs
  const favoriteSongs = songs?.filter(song => favorites?.includes(song.id)) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-glow">Library</h1>
        <p className="text-muted-foreground mt-1">Your music collection</p>
      </div>

      <LibraryTopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'songs' && (
        <div className="space-y-6">
          {/* Favorites Section */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-current" />
                <h2 className="text-xl font-semibold">Favorites</h2>
              </div>
              
              {favoritesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : favoriteSongs.length > 0 ? (
                <div className="space-y-2">
                  {favoriteSongs.map((song) => (
                    <SongListRow
                      key={song.id.toString()}
                      song={song}
                      isPlaying={currentSongId === song.id}
                      onPlay={() => setCurrentSongId(song.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No favorite songs yet. Add songs to your favorites from the overflow menu!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-current" />
                <h2 className="text-xl font-semibold">Favorites</h2>
              </div>
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">Sign in to view your favorite songs</p>
                <Button
                  onClick={() => requireAuth({ type: 'like', songId: BigInt(0) })}
                  variant="default"
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}

          {/* All Songs Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Songs</h2>
            {songs && songs.length > 0 ? (
              <div className="space-y-2">
                {songs.map((song) => (
                  <SongListRow
                    key={song.id.toString()}
                    song={song}
                    isPlaying={currentSongId === song.id}
                    onPlay={() => setCurrentSongId(song.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No songs in your library yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'playlists' && (
        selectedPlaylist ? (
          <PlaylistDetailView
            playlist={selectedPlaylist}
            onBack={handleBackToPlaylists}
            onPlay={handlePlaylistPlay}
            onSongSelect={setCurrentSongId}
            currentSongId={currentSongId}
            isShuffled={isShuffled}
            onShuffleToggle={handleShuffleToggle}
            repeatMode={repeatMode}
            onRepeatToggle={handleRepeatToggle}
            playlistQueue={playlistQueue}
          />
        ) : (
          <LibraryPlaylistsPanel
            onOpenPlaylist={handleOpenPlaylist}
            initialDeepLink={initialPlaylistDeepLink}
          />
        )
      )}

      <MusicPlayer
        song={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
}
