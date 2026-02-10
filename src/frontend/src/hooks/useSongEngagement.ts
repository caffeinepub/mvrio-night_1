import { useAuth } from '../context/AuthContext';
import { useToggleLikeSong, usePlaySong } from './useQueries';
import { isSignInRequiredError } from '../utils/authorizationErrors';

export function useSongEngagement() {
  const { isAuthenticated, requireAuth } = useAuth();
  const toggleLikeMutation = useToggleLikeSong();
  const playSongMutation = usePlaySong();

  const handleLike = async (songId: bigint) => {
    if (!isAuthenticated) {
      // Trigger soft sign-in modal with pending action
      requireAuth({
        type: 'like',
        songId,
      });
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync(songId);
    } catch (error: any) {
      // Only trigger auth flow for sign-in-required errors, not admin-only errors
      if (isSignInRequiredError(error)) {
        requireAuth({
          type: 'like',
          songId,
        });
      }
      // Other error handling is done in the mutation
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
