import type { SongView } from '../backend';

/**
 * Shuffle an array of songs using Fisher-Yates algorithm
 */
export function shuffleSongs(songs: SongView[]): SongView[] {
  const shuffled = [...songs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get the next song index in a playlist with repeat support
 */
export function getNextIndex(
  currentIndex: number,
  totalSongs: number,
  repeatMode: 'off' | 'all'
): number | null {
  const nextIndex = currentIndex + 1;
  
  if (nextIndex < totalSongs) {
    return nextIndex;
  }
  
  if (repeatMode === 'all') {
    return 0; // Loop back to start
  }
  
  return null; // End of playlist
}

/**
 * Get the previous song index in a playlist with repeat support
 */
export function getPreviousIndex(
  currentIndex: number,
  totalSongs: number,
  repeatMode: 'off' | 'all'
): number | null {
  const prevIndex = currentIndex - 1;
  
  if (prevIndex >= 0) {
    return prevIndex;
  }
  
  if (repeatMode === 'all') {
    return totalSongs - 1; // Loop to end
  }
  
  return null; // Start of playlist
}

/**
 * Find a song in the playlist by ID
 */
export function findSongIndex(songs: SongView[], songId: bigint): number {
  return songs.findIndex(s => s.id === songId);
}
