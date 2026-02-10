/**
 * Utilities for sharing songs and playlists via Web Share API or clipboard
 */

/**
 * Result of a share attempt
 */
export type ShareResult = 
  | { success: true }
  | { success: false; reason: 'cancelled' }
  | { success: false; reason: 'failed' };

/**
 * Checks if the Web Share API is available
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Shares content using the Web Share API
 * Returns a result object indicating success, user cancellation, or failure
 */
export async function shareViaWebShare(data: ShareData): Promise<ShareResult> {
  if (!isWebShareSupported()) {
    return { success: false, reason: 'failed' };
  }
  
  try {
    await navigator.share(data);
    return { success: true };
  } catch (error) {
    // User cancelled the share sheet
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, reason: 'cancelled' };
    }
    // Other errors (e.g., share failed)
    console.error('Web Share failed:', error);
    return { success: false, reason: 'failed' };
  }
}

/**
 * Copies text to clipboard
 * Returns true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}
