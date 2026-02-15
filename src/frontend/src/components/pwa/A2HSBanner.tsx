import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useA2HS } from '../../hooks/useA2HS';
import { useState, useEffect } from 'react';

export function A2HSBanner() {
  const { canInstall, isInstalled, promptInstall } = useA2HS();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('a2hs-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show banner only when eligible and not dismissed/installed
    setIsVisible(canInstall && !isDismissed && !isInstalled);
  }, [canInstall, isDismissed, isInstalled]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === 'accepted' || result === 'dismissed') {
      setIsVisible(false);
      sessionStorage.setItem('a2hs-banner-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('a2hs-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-primary/70 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-primary-foreground">
          Add to Home Screen
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="text-xs"
          >
            Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
