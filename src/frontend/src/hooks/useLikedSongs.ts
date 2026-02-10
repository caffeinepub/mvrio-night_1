import { useGetFavorites } from './useQueries';
import { useInternetIdentity } from './useInternetIdentity';

/**
 * Hook to manage liked song state for the current user
 * Returns a set of liked song IDs for quick lookup
 */
export function useLikedSongs() {
  const { identity } = useInternetIdentity();
  const { data: favorites } = useGetFavorites();
  
  const isAuthenticated = !!identity;
  
  // Create a Set for O(1) lookup
  const likedSongIds = new Set(favorites?.map(id => id.toString()) || []);
  
  const isLiked = (songId: bigint): boolean => {
    if (!isAuthenticated) return false;
    return likedSongIds.has(songId.toString());
  };
  
  return {
    isLiked,
    likedSongIds,
    isAuthenticated,
  };
}
