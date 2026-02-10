import { useState, useEffect } from 'react';
import { useGetAllSongs, useDeleteSong } from '../hooks/useQueries';
import { SongCard } from '../components/songs/SongCard';
import { SongEditor } from '../components/songs/SongEditor';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { HomeChannelBanner } from '../components/home/HomeChannelBanner';
import { HorizontalSongCard } from '../components/songs/HorizontalSongCard';
import { HorizontalSongRow } from '../components/songs/HorizontalSongRow';
import { useAdminContext } from '../context/AdminContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';
import type { SongView } from '../backend';

export function HomeScreen() {
  const { data: songs, isLoading } = useGetAllSongs();
  const deleteSongMutation = useDeleteSong();
  const { isAdmin } = useAdminContext();
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);

  const currentSong = songs?.find(s => s.id === currentSongId) || null;

  const handleDelete = async (id: bigint) => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    try {
      await deleteSongMutation.mutateAsync(id);
      if (currentSongId === id) {
        setCurrentSongId(null);
      }
      toast.success('Song deleted successfully');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      console.error('Delete song error:', error);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get new songs (last 4 by id)
  const newSongs = songs ? [...songs].reverse().slice(0, 4) : [];
  
  // Get top songs (first 4 as a simple heuristic)
  const topSongs = songs ? songs.slice(0, 4) : [];

  return (
    <div className="space-y-8">
      <HomeChannelBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-glow">Your Music</h1>
          <p className="text-muted-foreground mt-1">
            {songs?.length || 0} {songs?.length === 1 ? 'song' : 'songs'} in your library
          </p>
        </div>
        <SongEditor />
      </div>

      <MusicPlayer
        song={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {songs && songs.length > 0 ? (
        <>
          <HorizontalSongRow title="New Songs">
            {newSongs.map((song) => (
              <HorizontalSongCard
                key={song.id.toString()}
                song={song}
                onPlay={() => setCurrentSongId(song.id)}
                isPlaying={currentSongId === song.id}
              />
            ))}
          </HorizontalSongRow>

          <HorizontalSongRow title="Top Songs">
            {topSongs.map((song) => (
              <HorizontalSongCard
                key={song.id.toString()}
                song={song}
                onPlay={() => setCurrentSongId(song.id)}
                isPlaying={currentSongId === song.id}
              />
            ))}
          </HorizontalSongRow>

          <div>
            <h2 className="text-2xl font-bold mb-4">All Songs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {songs.map((song) => (
                <SongCard
                  key={song.id.toString()}
                  song={song}
                  onPlay={() => setCurrentSongId(song.id)}
                  onDelete={() => handleDelete(song.id)}
                  isPlaying={currentSongId === song.id}
                  showDelete={isAdmin}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No songs yet. Add your first song to get started!</p>
        </div>
      )}
    </div>
  );
}
