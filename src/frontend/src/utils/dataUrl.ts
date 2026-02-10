/**
 * Utilities for detecting and converting data URLs to bytes for blob storage
 */

/**
 * Check if a string is a data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Convert a data URL to a Uint8Array of bytes
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  // Extract the base64 part after the comma
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) {
    throw new Error('Invalid data URL format');
  }
  
  const base64 = dataUrl.substring(base64Index + 1);
  
  // Decode base64 to binary string
  const binaryString = atob(base64);
  
  // Convert binary string to Uint8Array with explicit ArrayBuffer type
  const buffer = new ArrayBuffer(binaryString.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}
