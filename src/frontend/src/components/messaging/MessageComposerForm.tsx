import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { AttachmentPicker } from './AttachmentPicker';

interface MessageComposerFormProps {
  onSend: (content: string, attachments?: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => Promise<void>;
  isSending: boolean;
  isAdminReply?: boolean;
  prefillContent?: string;
}

type MessageType = 'normal' | 'custom-song-request';

export function MessageComposerForm({ onSend, isSending, isAdminReply = false, prefillContent }: MessageComposerFormProps) {
  const [messageType, setMessageType] = useState<MessageType>('normal');
  const [message, setMessage] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [attachments, setAttachments] = useState<{
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }>({});

  // Prefill content on mount or when it changes
  useEffect(() => {
    if (prefillContent) {
      setMessage(prefillContent);
    }
  }, [prefillContent]);

  const formatCustomSongRequestMessage = (title: string, artist: string, notes: string): string => {
    const lines: string[] = [
      '🎵 Custom Song Request',
      '',
      `Song Title: ${title}`,
      `Artist Name: ${artist}`,
    ];

    if (notes.trim()) {
      lines.push('', 'Additional Notes:', notes);
    }

    return lines.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let content: string;
    if (isAdminReply || messageType === 'normal') {
      content = message.trim();
    } else {
      content = formatCustomSongRequestMessage(
        songTitle.trim(),
        artistName.trim(),
        additionalNotes.trim()
      );
    }

    if (!content) return;

    await onSend(content, attachments);

    // Reset form
    setMessage('');
    setSongTitle('');
    setArtistName('');
    setAdditionalNotes('');
    setAttachments({});
    setMessageType('normal');
  };

  const isFormValid = () => {
    if (isAdminReply) {
      return message.trim().length > 0;
    }
    if (messageType === 'normal') {
      return message.trim().length > 0;
    }
    return songTitle.trim().length > 0 && artistName.trim().length > 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isAdminReply && (
        <div className="space-y-2">
          <Label htmlFor="message-type">Message Type</Label>
          <Select value={messageType} onValueChange={(value) => setMessageType(value as MessageType)}>
            <SelectTrigger id="message-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Message</SelectItem>
              <SelectItem value="custom-song-request">Custom Song Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(isAdminReply || messageType === 'normal') ? (
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isAdminReply ? 'Type your reply...' : 'Type your message...'}
            rows={4}
            disabled={isSending}
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="song-title">Song Title *</Label>
            <Input
              id="song-title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Enter song title"
              disabled={isSending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist-name">Artist Name *</Label>
            <Input
              id="artist-name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name"
              disabled={isSending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional Notes</Label>
            <Textarea
              id="additional-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any special requests or details..."
              rows={3}
              disabled={isSending}
            />
          </div>
        </>
      )}

      <AttachmentPicker
        onAttachmentsChange={setAttachments}
        disabled={isSending}
      />

      <Button
        type="submit"
        disabled={!isFormValid() || isSending}
        className="w-full"
      >
        {isSending ? (
          'Sending...'
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {isAdminReply ? 'Send Reply' : 'Send Message'}
          </>
        )}
      </Button>
    </form>
  );
}
