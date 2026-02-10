import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Music as MusicIcon, Image as ImageIcon } from 'lucide-react';
import { validateAttachment } from '../../utils/messagingAttachments';
import { toast } from 'sonner';

interface AttachmentPickerProps {
  onAttachmentsChange: (attachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => void;
  disabled?: boolean;
}

export function AttachmentPicker({ onAttachmentsChange, disabled }: AttachmentPickerProps) {
  const [audioAttachment, setAudioAttachment] = useState<File | undefined>();
  const [imageAttachment, setImageAttachment] = useState<File | undefined>();
  const [pdfAttachment, setPdfAttachment] = useState<File | undefined>();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type
    let fileType: 'image' | 'audio' | 'pdf';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf';
    } else {
      toast.error('Unsupported file type. Please select an image, MP3, or PDF file.');
      e.target.value = '';
      return;
    }

    const validation = validateAttachment(file, fileType);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      e.target.value = '';
      return;
    }

    if (fileType === 'image') {
      setImageAttachment(file);
      onAttachmentsChange({ audioAttachment, imageAttachment: file, pdfAttachment });
    } else if (fileType === 'audio') {
      setAudioAttachment(file);
      onAttachmentsChange({ audioAttachment: file, imageAttachment, pdfAttachment });
    } else if (fileType === 'pdf') {
      setPdfAttachment(file);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment: file });
    }

    e.target.value = '';
  };

  const handleRemove = (type: 'audio' | 'image' | 'pdf') => {
    if (type === 'audio') {
      setAudioAttachment(undefined);
      onAttachmentsChange({ audioAttachment: undefined, imageAttachment, pdfAttachment });
    } else if (type === 'image') {
      setImageAttachment(undefined);
      onAttachmentsChange({ audioAttachment, imageAttachment: undefined, pdfAttachment });
    } else if (type === 'pdf') {
      setPdfAttachment(undefined);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment: undefined });
    }
  };

  const hasAttachments = !!(audioAttachment || imageAttachment || pdfAttachment);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => document.getElementById('attachment-input')?.click()}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Attach File
        </Button>
        <input
          id="attachment-input"
          type="file"
          accept="image/*,audio/mpeg,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {hasAttachments && (
        <div className="space-y-2">
          {imageAttachment && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{imageAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove('image')}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {audioAttachment && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <MusicIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{audioAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove('audio')}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {pdfAttachment && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{pdfAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove('pdf')}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
