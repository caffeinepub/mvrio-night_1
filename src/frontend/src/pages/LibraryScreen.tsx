import { useState } from 'react';
import { useGetAllSongs } from '../hooks/useQueries';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { LibraryTopTabs, type LibraryTab } from '../components/library/LibraryTopTabs';
import { LibraryPlaylistsPanel } from '../components/library/LibraryPlaylistsPanel';
import { SongListRow } from '../components/songs/SongListRow';
import { Loader2 } from 'lucide-react';
import type { SongView } from '../backend';

export function LibraryScreen() {
  const { data: songs, isLoading } = useGetAllSongs();
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>('songs');

  const currentSong = songs?.find(s => s.id === currentSongId) || null;

  const handleNext = () => {
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSongId(songs[nextIndex].id);
  };

  const handlePrevious = () => {
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentSongId(songs[prevIndex].id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold neon-glow">Library</h1>
        <p className="text-muted-foreground mt-1">
          Your personal music collection
        </p>
      </div>

      <MusicPlayer
        song={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      <LibraryTopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'songs' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : songs && songs.length > 0 ? (
            <div className="space-y-2">
              {songs.map((song) => (
                <SongListRow
                  key={song.id.toString()}
                  song={song}
                  onPlay={() => setCurrentSongId(song.id)}
                  isPlaying={currentSongId === song.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No songs in your library yet</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'playlists' && <LibraryPlaylistsPanel />}
    </div>
  );
}
