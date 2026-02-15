import { useEffect } from 'react';
import { useGetAllSongs, useDeleteSong } from '../hooks/useQueries';
import { SongListRow } from '../components/songs/SongListRow';
import { SongsSortBar } from '../components/songs/SongsSortBar';
import { useAdminContext } from '../context/AdminContext';
import { usePlayer } from '../context/PlayerContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';
import { sortByNewest, sortByTopSongs, sortByMostHeard } from '../utils/songSort';
import { useState } from 'react';

type SortOption = 'latest' | 'most-liked' | 'most-heard';

interface SongsScreenProps {
  initialSongId?: bigint | null;
  onDeepLinkHandled?: () => void;
}

export function SongsScreen({ initialSongId, onDeepLinkHandled }: SongsScreenProps) {
  const { data: songs, isLoading } = useGetAllSongs();
  const deleteSongMutation = useDeleteSong();
  const { isAdmin } = useAdminContext();
  const { currentSong, isPlaying, play } = usePlayer();
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Handle deep link song ID
  useEffect(() => {
    if (initialSongId && songs && songs.length > 0) {
      const song = songs.find(s => s.id === initialSongId);
      if (song) {
        play(song, songs);
      }
      onDeepLinkHandled?.();
    }
  }, [initialSongId, songs, onDeepLinkHandled, play]);

  const handleDelete = async (id: bigint) => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action.');
      return;
    }

    try {
      await deleteSongMutation.mutateAsync(id);
      toast.success('Song deleted successfully');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      console.error('Delete song error:', error);
    }
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

      {sortedSongs.length > 0 ? (
        <div className="space-y-2">
          {sortedSongs.map((song) => (
            <SongListRow
              key={song.id.toString()}
              song={song}
              isPlaying={currentSong?.id === song.id && isPlaying}
              onPlay={() => play(song, sortedSongs)}
              onDelete={isAdmin ? () => handleDelete(song.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No songs available</p>
        </div>
      )}
    </div>
  );
}
