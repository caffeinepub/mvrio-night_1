import { useState, useEffect } from 'react';
import { useGetAllSongs, useDeleteSong } from '../hooks/useQueries';
import { SongEditor } from '../components/songs/SongEditor';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { SongsSortBar, type SortOption } from '../components/songs/SongsSortBar';
import { SongListRow } from '../components/songs/SongListRow';
import { useAdminContext } from '../context/AdminContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';
import type { SongView } from '../backend';

interface SongsScreenProps {
  initialSongId?: bigint | null;
  onDeepLinkHandled?: () => void;
}

export function SongsScreen({ initialSongId, onDeepLinkHandled }: SongsScreenProps = {}) {
  const { data: songs, isLoading } = useGetAllSongs();
  const deleteSongMutation = useDeleteSong();
  const { isAdmin } = useAdminContext();
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Handle deep link on mount
  useEffect(() => {
    if (initialSongId && songs) {
      const songExists = songs.some(s => s.id === initialSongId);
      if (songExists) {
        setCurrentSongId(initialSongId);
        onDeepLinkHandled?.();
      }
    }
  }, [initialSongId, songs, onDeepLinkHandled]);

  // Apply sorting
  const sortedSongs = songs ? [...songs].sort((a, b) => {
    if (sortBy === 'latest') {
      return Number(b.id - a.id);
    } else if (sortBy === 'most-liked') {
      return Number(b.likesCount - a.likesCount);
    } else if (sortBy === 'most-heard') {
      return Number(b.playCount - a.playCount);
    }
    return 0;
  }) : [];

  const currentSong = sortedSongs?.find(s => s.id === currentSongId) || null;

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
    if (!sortedSongs || sortedSongs.length === 0) return;
    const currentIndex = sortedSongs.findIndex(s => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % sortedSongs.length;
    setCurrentSongId(sortedSongs[nextIndex].id);
  };

  const handlePrevious = () => {
    if (!sortedSongs || sortedSongs.length === 0) return;
    const currentIndex = sortedSongs.findIndex(s => s.id === currentSongId);
    const prevIndex = currentIndex <= 0 ? sortedSongs.length - 1 : currentIndex - 1;
    setCurrentSongId(sortedSongs[prevIndex].id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-glow">All Songs</h1>
          <p className="text-muted-foreground mt-1">
            Browse and play your entire collection
          </p>
        </div>
        <SongEditor />
      </div>

      <MusicPlayer
        song={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {sortedSongs && sortedSongs.length > 0 ? (
        <div>
          <SongsSortBar sortBy={sortBy} onSortChange={setSortBy} />
          <div className="space-y-2">
            {sortedSongs.map((song) => (
              <SongListRow
                key={song.id.toString()}
                song={song}
                onPlay={() => setCurrentSongId(song.id)}
                onDelete={isAdmin ? () => handleDelete(song.id) : undefined}
                isPlaying={currentSongId === song.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No songs yet. Add your first song to get started!</p>
        </div>
      )}
    </div>
  );
}
