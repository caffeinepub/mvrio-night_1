import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Image as ImageIcon, Music as MusicIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { validateAttachment } from '../../utils/messagingAttachments';

interface AttachmentPickerProps {
  onAttachmentsChange: (attachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => void;
  currentAttachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  };
}

export function AttachmentPicker({ onAttachmentsChange, currentAttachments }: AttachmentPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleFileSelect = async (type: 'image' | 'audio' | 'pdf') => {
    const input = document.createElement('input');
    input.type = 'file';
    
    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'audio':
        input.accept = 'audio/mpeg';
        break;
      case 'pdf':
        input.accept = 'application/pdf';
        break;
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const validation = validateAttachment(file, type);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      const key = type === 'image' ? 'imageAttachment' : type === 'audio' ? 'audioAttachment' : 'pdfAttachment';
      onAttachmentsChange({
        ...currentAttachments,
        [key]: file,
      });
      setShowPicker(false);
    };

    input.click();
  };

  const handleRemoveAttachment = (type: 'image' | 'audio' | 'pdf') => {
    const key = type === 'image' ? 'imageAttachment' : type === 'audio' ? 'audioAttachment' : 'pdfAttachment';
    const newAttachments = { ...currentAttachments };
    delete newAttachments[key];
    onAttachmentsChange(newAttachments);
  };

  const hasAttachments = !!(currentAttachments.imageAttachment || currentAttachments.audioAttachment || currentAttachments.pdfAttachment);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Attach File
        </Button>
      </div>

      {showPicker && (
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFileSelect('image')}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFileSelect('audio')}
          >
            <MusicIcon className="w-4 h-4 mr-2" />
            MP3
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFileSelect('pdf')}
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      )}

      {hasAttachments && (
        <div className="space-y-1">
          {currentAttachments.imageAttachment && (
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4" />
              <span className="flex-1 truncate">{currentAttachments.imageAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveAttachment('image')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {currentAttachments.audioAttachment && (
            <div className="flex items-center gap-2 text-sm">
              <MusicIcon className="w-4 h-4" />
              <span className="flex-1 truncate">{currentAttachments.audioAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveAttachment('audio')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {currentAttachments.pdfAttachment && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span className="flex-1 truncate">{currentAttachments.pdfAttachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveAttachment('pdf')}
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
