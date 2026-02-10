import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getAuthErrorMessage, isSignInRequiredError } from '../utils/authorizationErrors';

export function useGetPlaylistFavorites() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  // Only fetch for authenticated (non-anonymous) users
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<string[]>({
    queryKey: ['playlistFavorites'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlaylistFavorites();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useTogglePlaylistFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { requireAuth } = useAuth();

  return useMutation({
    mutationFn: async (playlistName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const wasRemoved = await actor.togglePlaylistFavorite(playlistName);
      return { playlistName, wasRemoved };
    },
    onMutate: async (playlistName) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['playlistFavorites'] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(['playlistFavorites']);

      // Optimistically update
      queryClient.setQueryData<string[]>(['playlistFavorites'], (old) => {
        if (!old) return [playlistName];
        if (old.includes(playlistName)) {
          return old.filter((name) => name !== playlistName);
        }
        return [...old, playlistName];
      });

      return { previousFavorites };
    },
    onSuccess: ({ wasRemoved }) => {
      if (wasRemoved) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
    },
    onError: (error: any, playlistName, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['playlistFavorites'], context.previousFavorites);
      }

      if (isSignInRequiredError(error)) {
        requireAuth({ type: 'playlist-favorites', playlistName });
      } else {
        const message = getAuthErrorMessage(error);
        toast.error(message);
      }
      console.error('Toggle playlist favorite error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['playlistFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Convenience hook for a specific playlist
 */
export function usePlaylistFavorites(playlistName: string) {
  const { data: favorites } = useGetPlaylistFavorites();
  const toggleMutation = useTogglePlaylistFavorite();

  const isFavorite = favorites?.includes(playlistName) ?? false;

  const toggleFavorite = async () => {
    await toggleMutation.mutateAsync(playlistName);
  };

  return {
    isFavorite,
    toggleFavorite,
    isToggling: toggleMutation.isPending,
  };
}
