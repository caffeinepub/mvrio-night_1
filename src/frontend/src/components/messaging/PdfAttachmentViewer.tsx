import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Maximize2 } from 'lucide-react';
import { downloadAttachment } from '../../utils/download';
import { toast } from 'sonner';

interface PdfAttachmentViewerProps {
  pdfUrl: string;
  fileName: string;
}

export function PdfAttachmentViewer({ pdfUrl, fileName }: PdfAttachmentViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadAttachment(pdfUrl, fileName);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="bg-background/50 rounded-lg border border-border overflow-hidden">
      {/* PDF Preview */}
      <div className={`${isExpanded ? 'h-96' : 'h-48'} transition-all duration-200`}>
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          title={fileName}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 p-2 bg-background border-t border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            title="Download PDF"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
