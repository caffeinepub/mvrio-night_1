import { useState, useEffect } from 'react';
import { useGetAllSongs, useDeleteSong } from '../hooks/useQueries';
import { SongCard } from '../components/songs/SongCard';
import { SongsSortBar } from '../components/songs/SongsSortBar';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { useAdminContext } from '../context/AdminContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';
import { sortByNewest, sortByTopSongs, sortByMostHeard } from '../utils/songSort';

type SortOption = 'latest' | 'most-liked' | 'most-heard';

interface SongsScreenProps {
  initialSongId?: bigint | null;
  onDeepLinkHandled?: () => void;
}

export function SongsScreen({ initialSongId, onDeepLinkHandled }: SongsScreenProps) {
  const { data: songs, isLoading } = useGetAllSongs();
  const deleteSongMutation = useDeleteSong();
  const { isAdmin } = useAdminContext();
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Handle deep link song ID
  useEffect(() => {
    if (initialSongId && songs && songs.length > 0) {
      const songExists = songs.some(s => s.id === initialSongId);
      if (songExists) {
        setCurrentSongId(initialSongId);
      }
      onDeepLinkHandled?.();
    }
  }, [initialSongId, songs, onDeepLinkHandled]);

  const currentSong = songs?.find(s => s.id === currentSongId) || null;

  const handleDelete = async (id: bigint) => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action.');
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

  // Apply sorting
  let sortedSongs = songs || [];
  switch (sortBy) {
    case 'latest':
      sortedSongs = sortByNewest(sortedSongs);
      break;
    case 'most-liked':
      sortedSongs = sortByTopSongs(sortedSongs);
      break;
    case 'most-heard':
      sortedSongs = sortByMostHeard(sortedSongs);
      break;
  }

  return (
    <div className="space-y-6">
      <SongsSortBar sortBy={sortBy} onSortChange={setSortBy} />

      <MusicPlayer
        song={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {sortedSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedSongs.map((song) => (
            <SongCard
              key={song.id.toString()}
              song={song}
              isPlaying={currentSongId === song.id}
              onPlay={() => setCurrentSongId(song.id)}
              onDelete={() => handleDelete(song.id)}
              showDelete={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No songs available</p>
        </div>
      )}
    </div>
  );
}
