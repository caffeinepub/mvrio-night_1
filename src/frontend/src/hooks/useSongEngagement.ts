import { useInternetIdentity } from './useInternetIdentity';
import { useToggleLikeSong, usePlaySong } from './useQueries';
import { toast } from 'sonner';

export function useSongEngagement() {
  const { identity } = useInternetIdentity();
  const toggleLikeMutation = useToggleLikeSong();
  const playSongMutation = usePlaySong();

  const isAuthenticated = !!identity;

  const handleLike = async (songId: bigint) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like songs');
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync(songId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handlePlay = async (songId: bigint) => {
    try {
      await playSongMutation.mutateAsync(songId);
    } catch (error) {
      // Silent fail for play count - not critical
    }
  };

  return {
    handleLike,
    handlePlay,
    isAuthenticated,
    isLiking: toggleLikeMutation.isPending,
  };
}
