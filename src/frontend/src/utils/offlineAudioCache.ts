/**
 * Utilities for opt-in offline audio caching
 */

const AUDIO_CACHE_NAME = 'mvrio-night-audio-v1';

/**
 * Caches an audio file for offline playback
 * This is an opt-in operation triggered by user action
 */
export async function cacheAudioForOffline(audioUrl: string, songTitle: string): Promise<void> {
  if (!audioUrl || audioUrl.trim() === '') {
    throw new Error('Invalid audio URL');
  }

  try {
    // Open the dedicated audio cache
    const cache = await caches.open(AUDIO_CACHE_NAME);
    
    // Fetch the audio file
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    
    // Store in cache
    await cache.put(audioUrl, response);
    
    console.log(`Cached audio for offline: ${songTitle}`);
  } catch (error) {
    console.error('Failed to cache audio for offline:', error);
    throw new Error('Failed to save audio for offline playback');
  }
}

/**
 * Checks if an audio file is cached for offline use
 */
export async function isAudioCached(audioUrl: string): Promise<boolean> {
  if (!audioUrl || audioUrl.trim() === '') {
    return false;
  }

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(audioUrl);
    return !!response;
  } catch (error) {
    console.error('Failed to check audio cache:', error);
    return false;
  }
}

/**
 * Removes an audio file from the offline cache
 */
export async function removeAudioFromCache(audioUrl: string): Promise<void> {
  if (!audioUrl || audioUrl.trim() === '') {
    return;
  }

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.delete(audioUrl);
    console.log('Removed audio from offline cache');
  } catch (error) {
    console.error('Failed to remove audio from cache:', error);
    throw new Error('Failed to remove audio from offline storage');
  }
}

/**
 * Clears all cached audio files
 */
export async function clearAllCachedAudio(): Promise<void> {
  try {
    await caches.delete(AUDIO_CACHE_NAME);
    console.log('Cleared all cached audio');
  } catch (error) {
    console.error('Failed to clear audio cache:', error);
    throw new Error('Failed to clear offline audio storage');
  }
}
