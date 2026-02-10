import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToggleLikeSong, useCreatePlaylist, useAddToPlaylist } from './useQueries';
import { cacheAudioForOffline } from '../utils/offlineAudioCache';
import { downloadSong } from '../utils/download';
import { toast } from 'sonner';
import { isAdminOnlyError, isSignInRequiredError } from '../utils/authorizationErrors';

/**
 * Hook that executes pending actions after successful authentication.
 * Monitors auth state and automatically retries the pending action once.
 */
export function usePendingAction() {
  const {
    isAuthenticated,
    pendingAction,
    clearPendingAction,
  } = useAuth();

  const toggleLikeMutation = useToggleLikeSong();
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();

  const executePendingAction = useCallback(async () => {
    if (!pendingAction || !isAuthenticated) {
      return;
    }

    try {
      switch (pendingAction.type) {
        case 'like':
        case 'unlike':
          if (pendingAction.songId) {
            await toggleLikeMutation.mutateAsync(pendingAction.songId);
            toast.success(pendingAction.type === 'like' ? 'Song liked' : 'Song unliked');
          }
          break;

        case 'create-playlist':
          if (pendingAction.playlistName) {
            await createPlaylistMutation.mutateAsync(pendingAction.playlistName);
            toast.success(`Created "${pendingAction.playlistName}"`);
          }
          break;

        case 'add-to-playlist':
          if (pendingAction.playlistName && pendingAction.songId) {
            await addToPlaylistMutation.mutateAsync({
              playlistName: pendingAction.playlistName,
              songId: pendingAction.songId,
            });
            toast.success('Added to playlist');
          }
          break;

        case 'offline-cache':
          if (pendingAction.audioUrl && pendingAction.songTitle) {
            await cacheAudioForOffline(pendingAction.audioUrl, pendingAction.songTitle);
            toast.success('Saved for offline');
          }
          break;

        case 'device-download':
          if (pendingAction.audioUrl && pendingAction.songTitle) {
            await downloadSong(pendingAction.audioUrl, pendingAction.songTitle);
            toast.success('Download started');
          }
          break;

        default:
          console.warn('Unknown pending action type:', pendingAction);
      }

      // Clear pending action after successful execution
      clearPendingAction();
    } catch (error: any) {
      // Check if error is admin-only (signed-in non-admin user)
      if (isAdminOnlyError(error)) {
        // Clear pending action - no point retrying, user is not admin
        clearPendingAction();
        toast.error('Admin access required');
        return;
      }

      // Check if error is sign-in required (guest user)
      if (isSignInRequiredError(error)) {
        // Don't clear pending action - user needs to try auth again
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      // Other errors - clear pending action and show error
      clearPendingAction();
      toast.error('Failed to complete action');
      console.error('Pending action execution error:', error);
    }
  }, [
    pendingAction,
    isAuthenticated,
    toggleLikeMutation,
    createPlaylistMutation,
    addToPlaylistMutation,
    clearPendingAction,
  ]);

  // Auto-execute pending action when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && pendingAction) {
      // Small delay to ensure auth state is fully propagated
      const timer = setTimeout(() => {
        executePendingAction();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pendingAction, executePendingAction]);

  return {
    executePendingAction,
  };
}
