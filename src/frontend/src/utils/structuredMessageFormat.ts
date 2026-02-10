/**
 * Utility to format structured message submissions into a single readable string
 * with consistent formatting for both Normal Message and Custom Song Request types.
 */

export interface NormalMessageFields {
  name: string;
  contactInfo: string;
  messageDetails: string;
  additionalNotes?: string;
}

export interface CustomSongRequestFields extends NormalMessageFields {
  songDetails: string;
}

export function formatNormalMessage(fields: NormalMessageFields): string {
  const lines: string[] = [
    '📧 Normal Message',
    '',
    `Name: ${fields.name}`,
    `Contact: ${fields.contactInfo}`,
    '',
    `Message:`,
    fields.messageDetails,
  ];

  if (fields.additionalNotes && fields.additionalNotes.trim()) {
    lines.push('', 'Additional Notes:', fields.additionalNotes);
  }

  return lines.join('\n');
}

export function formatCustomSongRequest(fields: CustomSongRequestFields): string {
  const lines: string[] = [
    '🎵 Custom Song Request',
    '',
    `Name: ${fields.name}`,
    `Contact: ${fields.contactInfo}`,
    '',
    `Song Details:`,
    fields.songDetails,
    '',
    `Message:`,
    fields.messageDetails,
  ];

  if (fields.additionalNotes && fields.additionalNotes.trim()) {
    lines.push('', 'Additional Notes:', fields.additionalNotes);
  }

  return lines.join('\n');
}
