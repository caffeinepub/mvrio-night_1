/**
 * Utilities for downloading song audio files
 */

/**
 * Checks if a song has a usable audio URL
 */
export function hasUsableAudioUrl(audioUrl: string | undefined): boolean {
  if (!audioUrl) return false;
  if (audioUrl.trim() === '') return false;
  
  try {
    new URL(audioUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Slugifies a song title into a safe filename
 * Removes special characters and replaces spaces with hyphens
 */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a safe filename from song title
 * Falls back to a generic name if slugification fails
 */
export function generateFilename(title: string, extension: string = 'mp3'): string {
  const slug = slugifyTitle(title);
  if (slug.length === 0) {
    return `song-${Date.now()}.${extension}`;
  }
  return `${slug}.${extension}`;
}

/**
 * Triggers a browser download of a file from a URL
 * Uses a temporary anchor element with the download attribute
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Create temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Downloads a song's audio file with a slugged filename
 */
export async function downloadSong(audioUrl: string, songTitle: string): Promise<void> {
  if (!hasUsableAudioUrl(audioUrl)) {
    throw new Error('No audio URL available');
  }
  
  const filename = generateFilename(songTitle);
  await downloadFile(audioUrl, filename);
}
