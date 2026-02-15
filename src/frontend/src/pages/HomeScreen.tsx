import { useGetAllSongs, useDeleteSong } from '../hooks/useQueries';
import { SongEditor } from '../components/songs/SongEditor';
import { HomeChannelBanner } from '../components/home/HomeChannelBanner';
import { HorizontalSongCard } from '../components/songs/HorizontalSongCard';
import { HorizontalSongRow } from '../components/songs/HorizontalSongRow';
import { useAdminContext } from '../context/AdminContext';
import { usePlayer } from '../context/PlayerContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';
import { sortByNewest, sortByTopSongs } from '../utils/songSort';

export function HomeScreen() {
  const { data: songs, isLoading } = useGetAllSongs();
  const deleteSongMutation = useDeleteSong();
  const { isAdmin } = useAdminContext();
  const { currentSong, isPlaying, play } = usePlayer();

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

  const newSongs = songs ? sortByNewest(songs).slice(0, 4) : [];
  const topSongs = songs ? sortByTopSongs(songs).slice(0, 4) : [];

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

      {songs && songs.length > 0 ? (
        <>
          <HorizontalSongRow title="New Songs">
            {newSongs.map((song) => (
              <HorizontalSongCard
                key={song.id.toString()}
                song={song}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPlay={() => play(song, songs)}
              />
            ))}
          </HorizontalSongRow>

          <HorizontalSongRow title="Top Songs">
            {topSongs.map((song) => (
              <HorizontalSongCard
                key={song.id.toString()}
                song={song}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPlay={() => play(song, songs)}
              />
            ))}
          </HorizontalSongRow>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No songs yet. Add your first song to get started!</p>
        </div>
      )}
    </div>
  );
}
