const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export type FileCategory = 'image' | 'audio' | 'pdf' | 'other';

export function categorizeFile(file: File): FileCategory {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Image files
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  // Audio files
  if (mimeType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
    return 'audio';
  }

  // PDF files
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  // Everything else
  return 'other';
}

export function validateAttachment(file: File, category: FileCategory): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  // All categories are now allowed, just validate size
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

export function getAttachmentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('zip')) return 'Archive';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation';
  return 'File';
}

export function getAttachmentFileName(attachment: { fileName: string; mimeType: string }): string {
  // Return the fileName if it's not "unknown", otherwise generate a fallback
  if (attachment.fileName && attachment.fileName !== 'unknown') {
    return attachment.fileName;
  }

  // Generate fallback based on mimeType
  const type = getAttachmentType(attachment.mimeType);
  const extension = getExtensionFromMimeType(attachment.mimeType);
  return `${type.toLowerCase()}-attachment${extension}`;
}

function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'audio/mpeg') return '.mp3';
  if (mimeType === 'audio/wav') return '.wav';
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType.includes('zip')) return '.zip';
  if (mimeType.includes('word')) return '.docx';
  if (mimeType.includes('excel')) return '.xlsx';
  if (mimeType.includes('powerpoint')) return '.pptx';
  return '';
}
