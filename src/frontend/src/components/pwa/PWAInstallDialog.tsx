import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, Download, CheckCircle } from 'lucide-react';

interface PWAInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInstalled?: boolean;
}

export function PWAInstallDialog({ open, onOpenChange, isInstalled = false }: PWAInstallDialogProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;

  // Determine the appropriate message
  let title = 'Install MVRIO Night';
  let description = '';
  let instructions: React.ReactElement | null = null;

  if (isInstalled || isStandalone) {
    title = 'App Already Installed';
    description = 'MVRIO Night is already installed on your device.';
    instructions = (
      <div className="flex items-center justify-center gap-2 text-primary py-4">
        <CheckCircle className="w-6 h-6" />
        <span className="font-medium">You're all set!</span>
      </div>
    );
  } else if (isIOS) {
    if (isSafari) {
      title = 'Install on iOS';
      description = 'Add MVRIO Night to your home screen for the best experience.';
      instructions = (
        <div className="space-y-3 text-sm">
          <p className="font-medium">To install on iOS:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Tap the <Share className="inline w-4 h-4 mx-1" /> Share button at the bottom of Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
        </div>
      );
    } else {
      title = 'Open in Safari';
      description = 'To install MVRIO Night on iOS, please open this page in Safari.';
      instructions = (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            iOS apps can only be installed from Safari browser. Copy the URL and open it in Safari to install.
          </p>
        </div>
      );
    }
  } else {
    title = 'Install MVRIO Night';
    description = 'Add MVRIO Night to your device for quick access.';
    instructions = (
      <div className="space-y-3 text-sm">
        <p className="font-medium">To install:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Look for the install icon <Download className="inline w-4 h-4 mx-1" /> in your browser's address bar</li>
          <li>Or use your browser's menu to find "Install app" or "Add to Home Screen"</li>
          <li>Chrome: Menu → Install app</li>
          <li>Edge: Menu → Apps → Install this site as an app</li>
        </ul>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {instructions}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
