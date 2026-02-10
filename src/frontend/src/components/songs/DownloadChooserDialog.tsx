import { Download, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface DownloadChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfflineCache: () => void;
  onDeviceDownload: () => void;
  isLoading?: boolean;
}

export function DownloadChooserDialog({
  open,
  onOpenChange,
  onOfflineCache,
  onDeviceDownload,
  isLoading = false,
}: DownloadChooserDialogProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-3 py-2">
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-4"
        onClick={onOfflineCache}
        disabled={isLoading}
      >
        <Wifi className="w-5 h-5 flex-shrink-0" />
        <div className="text-left">
          <div className="font-medium">Keep available offline in the app</div>
          <div className="text-xs text-muted-foreground mt-1">
            Play this song without internet inside the app
          </div>
        </div>
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-auto py-4"
        onClick={onDeviceDownload}
        disabled={isLoading}
      >
        <Download className="w-5 h-5 flex-shrink-0" />
        <div className="text-left">
          <div className="font-medium">Download to device</div>
          <div className="text-xs text-muted-foreground mt-1">
            Save the audio file to your device storage
          </div>
        </div>
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Download Options</DrawerTitle>
            <DrawerDescription>
              Choose how you want to save this song
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Choose how you want to save this song
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
