/**
 * Utilities for creating and parsing song and playlist deep links
 */

const SONG_PARAM = 'song';
const PLAYLIST_PARAM = 'playlist';
const PLAYLIST_TYPE_PARAM = 'playlistType';

/**
 * Builds a deep link URL for a specific song
 * Compatible with both query-string and hash-based routing
 */
export function buildSongDeepLink(songId: bigint): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set(SONG_PARAM, songId.toString());
  
  // Use hash-based routing to match the app's routing approach
  return `${baseUrl}#/?${params.toString()}`;
}

/**
 * Builds a deep link URL for a specific playlist
 * Compatible with hash-based routing
 */
export function buildPlaylistDeepLink(playlistName: string, playlistType: 'user' | 'official'): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set(PLAYLIST_PARAM, playlistName);
  params.set(PLAYLIST_TYPE_PARAM, playlistType);
  
  // Use hash-based routing to match the app's routing approach
  return `${baseUrl}#/?${params.toString()}`;
}

/**
 * Parses a song ID from the current URL
 * Works with both query-string and hash-based routing
 */
export function parseSongIdFromUrl(): bigint | null {
  // Try regular query string first
  const urlParams = new URLSearchParams(window.location.search);
  const regularParam = urlParams.get(SONG_PARAM);
  
  if (regularParam !== null) {
    try {
      return BigInt(regularParam);
    } catch {
      return null;
    }
  }
  
  // Try hash-based routing
  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf('?');
  
  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    const hashParam = hashParams.get(SONG_PARAM);
    
    if (hashParam !== null) {
      try {
        return BigInt(hashParam);
      } catch {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Parses playlist information from the current URL
 * Returns { name, type } or null if no playlist deep link is present
 */
export function parsePlaylistFromUrl(): { name: string; type: 'user' | 'official' } | null {
  // Try regular query string first
  const urlParams = new URLSearchParams(window.location.search);
  const regularName = urlParams.get(PLAYLIST_PARAM);
  const regularType = urlParams.get(PLAYLIST_TYPE_PARAM);
  
  if (regularName !== null && (regularType === 'user' || regularType === 'official')) {
    return { name: regularName, type: regularType };
  }
  
  // Try hash-based routing
  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf('?');
  
  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    const hashName = hashParams.get(PLAYLIST_PARAM);
    const hashType = hashParams.get(PLAYLIST_TYPE_PARAM);
    
    if (hashName !== null && (hashType === 'user' || hashType === 'official')) {
      return { name: hashName, type: hashType };
    }
  }
  
  return null;
}

/**
 * Clears the song parameter from the URL without reloading
 * Prevents repeated deep-link handling
 */
export function clearSongParamFromUrl(): void {
  if (!window.history.replaceState) {
    return;
  }
  
  // Clear from regular query string
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(SONG_PARAM)) {
    urlParams.delete(SONG_PARAM);
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
    return;
  }
  
  // Clear from hash
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return;
  }
  
  const hashContent = hash.substring(1);
  const queryStartIndex = hashContent.indexOf('?');
  
  if (queryStartIndex === -1) {
    return;
  }
  
  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);
  
  const params = new URLSearchParams(queryString);
  if (!params.has(SONG_PARAM)) {
    return;
  }
  
  params.delete(SONG_PARAM);
  
  const newQueryString = params.toString();
  let newHash = routePath;
  
  if (newQueryString) {
    newHash += '?' + newQueryString;
  }
  
  const newUrl = window.location.pathname + window.location.search + (newHash ? '#' + newHash : '');
  window.history.replaceState(null, '', newUrl);
}

/**
 * Clears the playlist parameters from the URL without reloading
 * Prevents repeated deep-link handling
 */
export function clearPlaylistParamFromUrl(): void {
  if (!window.history.replaceState) {
    return;
  }
  
  // Clear from regular query string
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(PLAYLIST_PARAM) || urlParams.has(PLAYLIST_TYPE_PARAM)) {
    urlParams.delete(PLAYLIST_PARAM);
    urlParams.delete(PLAYLIST_TYPE_PARAM);
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
    return;
  }
  
  // Clear from hash
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return;
  }
  
  const hashContent = hash.substring(1);
  const queryStartIndex = hashContent.indexOf('?');
  
  if (queryStartIndex === -1) {
    return;
  }
  
  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);
  
  const params = new URLSearchParams(queryString);
  if (!params.has(PLAYLIST_PARAM) && !params.has(PLAYLIST_TYPE_PARAM)) {
    return;
  }
  
  params.delete(PLAYLIST_PARAM);
  params.delete(PLAYLIST_TYPE_PARAM);
  
  const newQueryString = params.toString();
  let newHash = routePath;
  
  if (newQueryString) {
    newHash += '?' + newQueryString;
  }
  
  const newUrl = window.location.pathname + window.location.search + (newHash ? '#' + newHash : '');
  window.history.replaceState(null, '', newUrl);
}
