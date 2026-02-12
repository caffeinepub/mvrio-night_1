import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Music as MusicIcon, Image as ImageIcon, File } from 'lucide-react';
import { validateAttachment, categorizeFile } from '../../utils/messagingAttachments';
import { toast } from 'sonner';

interface AttachmentPickerProps {
  onAttachmentsChange: (attachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
    fileAttachment?: File;
  }) => void;
  disabled?: boolean;
}

export function AttachmentPicker({ onAttachmentsChange, disabled }: AttachmentPickerProps) {
  const [audioAttachment, setAudioAttachment] = useState<File | undefined>();
  const [imageAttachment, setImageAttachment] = useState<File | undefined>();
  const [pdfAttachment, setPdfAttachment] = useState<File | undefined>();
  const [fileAttachment, setFileAttachment] = useState<File | undefined>();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Categorize the file
    const category = categorizeFile(file);

    // Validate the file
    const validation = validateAttachment(file, category);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      e.target.value = '';
      return;
    }

    // Set the appropriate attachment based on category
    if (category === 'image') {
      setImageAttachment(file);
      onAttachmentsChange({ audioAttachment, imageAttachment: file, pdfAttachment, fileAttachment });
    } else if (category === 'audio') {
      setAudioAttachment(file);
      onAttachmentsChange({ audioAttachment: file, imageAttachment, pdfAttachment, fileAttachment });
    } else if (category === 'pdf') {
      setPdfAttachment(file);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment: file, fileAttachment });
    } else {
      setFileAttachment(file);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment, fileAttachment: file });
    }

    e.target.value = '';
  };

  const handleRemove = (type: 'audio' | 'image' | 'pdf' | 'file') => {
    if (type === 'audio') {
      setAudioAttachment(undefined);
      onAttachmentsChange({ audioAttachment: undefined, imageAttachment, pdfAttachment, fileAttachment });
    } else if (type === 'image') {
      setImageAttachment(undefined);
      onAttachmentsChange({ audioAttachment, imageAttachment: undefined, pdfAttachment, fileAttachment });
    } else if (type === 'pdf') {
      setPdfAttachment(undefined);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment: undefined, fileAttachment });
    } else if (type === 'file') {
      setFileAttachment(undefined);
      onAttachmentsChange({ audioAttachment, imageAttachment, pdfAttachment, fileAttachment: undefined });
    }
  };

  const hasAttachments = !!(audioAttachment || imageAttachment || pdfAttachment || fileAttachment);

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
          accept="*/*"
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
          {fileAttachment && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <File className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{fileAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove('file')}
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
