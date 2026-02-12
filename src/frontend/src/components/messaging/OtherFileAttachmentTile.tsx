import { Button } from '@/components/ui/button';
import { Download, File } from 'lucide-react';
import { downloadAttachment } from '../../utils/download';
import { toast } from 'sonner';

interface OtherFileAttachmentTileProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export function OtherFileAttachmentTile({ fileUrl, fileName, mimeType }: OtherFileAttachmentTileProps) {
  const handleDownload = async () => {
    try {
      await downloadAttachment(fileUrl, fileName);
      toast.success('File downloaded');
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const getFileTypeLabel = (): string => {
    if (mimeType.includes('zip')) return 'ZIP Archive';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation';
    if (mimeType.includes('text')) return 'Text File';
    return 'File';
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="w-full bg-background/50 rounded-lg border border-border p-3 hover:bg-background/70 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <File className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">{getFileTypeLabel()}</p>
        </div>

        <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}
