import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { AttachmentPicker } from './AttachmentPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface MessageComposerFormProps {
  onSubmit: (content: string, attachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => void;
  isLoading: boolean;
  prefillContent?: string;
  isAdminMode?: boolean;
}

type MessageType = 'normal' | 'song-request';

export function MessageComposerForm({ onSubmit, isLoading, prefillContent, isAdminMode = false }: MessageComposerFormProps) {
  const [messageType, setMessageType] = useState<MessageType>('normal');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }>({});

  // Song request fields
  const [songRequestFields, setSongRequestFields] = useState({
    name: '',
    contactInfo: '',
    songDetails: '',
    messageDetails: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (prefillContent) {
      setContent(prefillContent);
    }
  }, [prefillContent]);

  const handleSubmit = () => {
    let finalContent = content;

    if (messageType === 'song-request' && !isAdminMode) {
      // Format song request
      const lines: string[] = [
        '🎵 Custom Song Request',
        '',
        `Name: ${songRequestFields.name}`,
        `Contact: ${songRequestFields.contactInfo}`,
        '',
        `Song Details:`,
        songRequestFields.songDetails,
        '',
        `Message:`,
        songRequestFields.messageDetails,
      ];

      if (songRequestFields.additionalNotes.trim()) {
        lines.push('', 'Additional Notes:', songRequestFields.additionalNotes);
      }

      finalContent = lines.join('\n');
    }

    if (!finalContent.trim()) return;

    onSubmit(finalContent, attachments);
    setContent('');
    setAttachments({});
    setSongRequestFields({
      name: '',
      contactInfo: '',
      songDetails: '',
      messageDetails: '',
      additionalNotes: '',
    });
    setMessageType('normal');
  };

  const isFormValid = () => {
    if (messageType === 'normal') {
      return content.trim().length > 0;
    } else {
      return (
        songRequestFields.name.trim().length > 0 &&
        songRequestFields.contactInfo.trim().length > 0 &&
        songRequestFields.songDetails.trim().length > 0 &&
        songRequestFields.messageDetails.trim().length > 0
      );
    }
  };

  if (isAdminMode) {
    // Admin mode - simple reply form
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
          />
          <AttachmentPicker
            onAttachmentsChange={setAttachments}
            currentAttachments={attachments}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!content.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User mode - with message type selection
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="message-type">Message Type</Label>
          <Select value={messageType} onValueChange={(value) => setMessageType(value as MessageType)}>
            <SelectTrigger id="message-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Message</SelectItem>
              <SelectItem value="song-request">Custom Song Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {messageType === 'normal' ? (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
            />
            <AttachmentPicker
              onAttachmentsChange={setAttachments}
              currentAttachments={attachments}
            />
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={songRequestFields.name}
                onChange={(e) => setSongRequestFields({ ...songRequestFields, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Info *</Label>
              <Input
                id="contact"
                value={songRequestFields.contactInfo}
                onChange={(e) => setSongRequestFields({ ...songRequestFields, contactInfo: e.target.value })}
                placeholder="Email, phone, or social media"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="song-details">Song Details *</Label>
              <Textarea
                id="song-details"
                value={songRequestFields.songDetails}
                onChange={(e) => setSongRequestFields({ ...songRequestFields, songDetails: e.target.value })}
                placeholder="Describe the song (genre, mood, tempo, etc.)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={songRequestFields.messageDetails}
                onChange={(e) => setSongRequestFields({ ...songRequestFields, messageDetails: e.target.value })}
                placeholder="Additional message or context..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={songRequestFields.additionalNotes}
                onChange={(e) => setSongRequestFields({ ...songRequestFields, additionalNotes: e.target.value })}
                placeholder="Any extra details..."
                rows={2}
              />
            </div>

            <AttachmentPicker
              onAttachmentsChange={setAttachments}
              currentAttachments={attachments}
            />
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            'Sending...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
