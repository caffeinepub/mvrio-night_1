import type { SongView } from '../backend';

/**
 * Sort songs newest-first (highest id first).
 * This is the deterministic "Latest" sort used across the app.
 */
export function sortByNewest(songs: SongView[]): SongView[] {
  return [...songs].sort((a, b) => {
    // Sort by id descending (newest first)
    if (a.id > b.id) return -1;
    if (a.id < b.id) return 1;
    return 0;
  });
}

/**
 * Sort songs by likesCount descending, with newest-first tie-breaker.
 * This is the deterministic "Top Songs" sort.
 */
export function sortByTopSongs(songs: SongView[]): SongView[] {
  return [...songs].sort((a, b) => {
    // Primary sort: likesCount descending
    if (a.likesCount > b.likesCount) return -1;
    if (a.likesCount < b.likesCount) return 1;
    
    // Tie-breaker: newest first (id descending)
    if (a.id > b.id) return -1;
    if (a.id < b.id) return 1;
    return 0;
  });
}

/**
 * Sort songs by playCount descending, with newest-first tie-breaker.
 */
export function sortByMostHeard(songs: SongView[]): SongView[] {
  return [...songs].sort((a, b) => {
    // Primary sort: playCount descending
    if (a.playCount > b.playCount) return -1;
    if (a.playCount < b.playCount) return 1;
    
    // Tie-breaker: newest first (id descending)
    if (a.id > b.id) return -1;
    if (a.id < b.id) return 1;
    return 0;
  });
}
