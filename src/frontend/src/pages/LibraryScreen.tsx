import { useState, useEffect } from 'react';
import { LibraryTopTabs } from '../components/library/LibraryTopTabs';
import { LibraryPlaylistsPanel } from '../components/library/LibraryPlaylistsPanel';
import { PlaylistDetailView } from '../components/library/PlaylistDetailView';
import { SongListRow } from '../components/songs/SongListRow';
import { useGetFavorites, useGetAllSongs } from '../hooks/useQueries';
import { usePlayer } from '../context/PlayerContext';
import { Loader2, Music } from 'lucide-react';
import type { SongView } from '../backend';

type PlaylistDeepLink = {
  name: string;
  type: 'user' | 'official';
};

interface LibraryScreenProps {
  initialPlaylistDeepLink?: PlaylistDeepLink | null;
  onPlaylistDeepLinkHandled?: () => void;
}

export function LibraryScreen({ initialPlaylistDeepLink, onPlaylistDeepLinkHandled }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>('songs');
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ name: string; type: 'user' | 'official' } | null>(null);
  
  const { data: favoriteIds, isLoading: favoritesLoading } = useGetFavorites();
  const { data: allSongs, isLoading: songsLoading } = useGetAllSongs();
  const { currentSong, isPlaying, play } = usePlayer();

  // Handle playlist deep link
  useEffect(() => {
    if (initialPlaylistDeepLink) {
      setActiveTab('playlists');
      setSelectedPlaylist(initialPlaylistDeepLink);
      onPlaylistDeepLinkHandled?.();
    }
  }, [initialPlaylistDeepLink, onPlaylistDeepLinkHandled]);

  const favoriteSongs = allSongs?.filter(song => 
    favoriteIds?.some(id => id === song.id)
  ) || [];

  const handlePlaylistRenamed = (oldName: string, newName: string) => {
    if (selectedPlaylist && selectedPlaylist.name === oldName) {
      setSelectedPlaylist({ ...selectedPlaylist, name: newName });
    }
  };

  const handlePlaySong = (song: SongView, queue: SongView[], shuffle: boolean, repeat: boolean) => {
    play(song, queue, shuffle, repeat);
  };

  if (selectedPlaylist) {
    return (
      <PlaylistDetailView
        playlistName={selectedPlaylist.name}
        playlistType={selectedPlaylist.type}
        onBack={() => setSelectedPlaylist(null)}
        onPlaySong={handlePlaySong}
        currentSongId={currentSong?.id || null}
        isPlaying={isPlaying}
        onPlaylistRenamed={handlePlaylistRenamed}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Library</h1>
      
      <LibraryTopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'songs' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Favorite Songs</h2>
          {favoritesLoading || songsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : favoriteSongs.length > 0 ? (
            <div className="space-y-2">
              {favoriteSongs.map((song) => (
                <SongListRow
                  key={song.id.toString()}
                  song={song}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onPlay={() => play(song, favoriteSongs)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No favorite songs yet</p>
            </div>
          )}
        </div>
      ) : (
        <LibraryPlaylistsPanel
          onSelectPlaylist={(name, type) => setSelectedPlaylist({ name, type })}
        />
      )}
    </div>
  );
}
