/**
 * Utilities for sharing songs via Web Share API or clipboard
 */

/**
 * Checks if the Web Share API is available
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Shares content using the Web Share API
 * Returns true if successful, false if cancelled or unsupported
 */
export async function shareViaWebShare(data: ShareData): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or share failed
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled, not an error
      return false;
    }
    console.error('Web Share failed:', error);
    return false;
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
