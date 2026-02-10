import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInternetIdentity } from './useInternetIdentity';
import {
  useToggleLikeSong,
  useCreatePlaylist,
  useAddToPlaylist,
} from './useQueries';
import { cacheAudioForOffline } from '../utils/offlineAudioCache';
import { downloadSong } from '../utils/download';
import { toast } from 'sonner';
import { isAdminRequiredError } from '../utils/authorizationErrors';

/**
 * Hook that monitors authentication state and automatically executes
 * pending actions once after successful sign-in.
 */
export function usePendingAction() {
  const { isAuthenticated, pendingAction, clearPendingAction, closeSignInModal, returnPath } = useAuth();
  const { loginStatus } = useInternetIdentity();
  const hasExecuted = useRef(false);

  const toggleLikeMutation = useToggleLikeSong();
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();

  useEffect(() => {
    // Only execute once when user becomes authenticated and we have a pending action
    if (
      isAuthenticated &&
      pendingAction &&
      loginStatus === 'success' &&
      !hasExecuted.current
    ) {
      hasExecuted.current = true;

      const executePendingAction = async () => {
        try {
          switch (pendingAction.type) {
            case 'like':
              if (pendingAction.songId) {
                await toggleLikeMutation.mutateAsync(pendingAction.songId);
                toast.success('Song liked');
              }
              break;

            case 'create-playlist':
              // This will be handled by CreatePlaylistDialog after sign-in
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
          }

          // Restore scroll position if available
          if (returnPath) {
            setTimeout(() => {
              window.scrollTo(0, returnPath.scrollY);
            }, 100);
          }
        } catch (error: any) {
          // Check if this is an admin-required error
          if (isAdminRequiredError(error)) {
            toast.error('You do not have permission to perform this action.');
            // Don't retry for admin-only errors
          } else {
            toast.error('Failed to complete action');
            console.error('Pending action error:', error);
          }
        } finally {
          clearPendingAction();
          closeSignInModal();
        }
      };

      executePendingAction();
    }
  }, [
    isAuthenticated,
    pendingAction,
    loginStatus,
    toggleLikeMutation,
    createPlaylistMutation,
    addToPlaylistMutation,
    clearPendingAction,
    closeSignInModal,
    returnPath,
  ]);

  // Reset execution flag when pending action is cleared
  useEffect(() => {
    if (!pendingAction) {
      hasExecuted.current = false;
    }
  }, [pendingAction]);
}
