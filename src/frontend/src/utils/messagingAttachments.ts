const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachment(file: File, type: 'image' | 'audio' | 'pdf'): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  switch (type) {
    case 'image':
      if (!file.type.startsWith('image/')) {
        return {
          valid: false,
          error: 'File must be an image',
        };
      }
      break;
    case 'audio':
      if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3') {
        return {
          valid: false,
          error: 'File must be an MP3 audio file',
        };
      }
      break;
    case 'pdf':
      if (file.type !== 'application/pdf') {
        return {
          valid: false,
          error: 'File must be a PDF document',
        };
      }
      break;
  }

  return { valid: true };
}

export async function fileToBytes(file: File): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
