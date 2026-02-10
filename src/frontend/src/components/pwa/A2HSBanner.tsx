import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useA2HS } from '../../hooks/useA2HS';

const SESSION_KEY = 'a2hs-banner-hidden';

export function A2HSBanner() {
  const [visible, setVisible] = useState(true);
  const { promptInstall, canInstall } = useA2HS();

  useEffect(() => {
    const isHidden = sessionStorage.getItem(SESSION_KEY);
    if (isHidden === 'true') {
      setVisible(false);
    }
  }, []);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    // Hide banner after user interacts with install prompt (regardless of outcome)
    if (outcome !== null) {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  };

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, 'true');
  };

  // Don't render if:
  // - User manually closed it
  // - Install is not supported/available
  // - App is already installed
  if (!visible || !canInstall) return null;

  return (
    <div className="banner-gradient-stars w-full border-b border-border/30">
      <div className="flex items-center justify-between gap-4 px-4 py-3 relative z-10">
        <p className="flex-1 text-sm text-white/90 text-center">
          🌌 Add MVRIO Night to your Home Screen — One tap for full offline experience
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Add to Home Screen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
