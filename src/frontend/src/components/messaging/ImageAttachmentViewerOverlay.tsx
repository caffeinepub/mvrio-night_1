import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { downloadAttachment } from '../../utils/download';
import { toast } from 'sonner';

interface ImageAttachmentViewerOverlayProps {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}

export function ImageAttachmentViewerOverlay({ 
  imageUrl, 
  fileName, 
  onClose 
}: ImageAttachmentViewerOverlayProps) {
  const handleDownload = async () => {
    try {
      await downloadAttachment(imageUrl, fileName);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <span className="text-sm text-white font-medium truncate max-w-[70%]">
            {fileName}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-full bg-black/90 p-8">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
