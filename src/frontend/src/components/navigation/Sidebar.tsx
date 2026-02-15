import { Home, Music, Library, Search, Info, Palette, Settings, Heart, MessageCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useA2HS } from '../../hooks/useA2HS';
import { PWAInstallDialog } from '../pwa/PWAInstallDialog';
import { useState } from 'react';
import type { Screen } from '../../App';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ currentScreen, onNavigate, isOpen, onOpenChange }: SidebarProps) {
  const { canInstall, isInstalled, promptInstall } = useA2HS();
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    onOpenChange(false);
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const result = await promptInstall();
      // Silent handling - no action needed for dismissed
    } else {
      // Show help dialog with appropriate guidance
      setShowInstallDialog(true);
    }
  };

  const menuItems = [
    { screen: 'home' as Screen, icon: Home, label: 'Home' },
    { screen: 'songs' as Screen, icon: Music, label: 'Songs' },
    { screen: 'library' as Screen, icon: Library, label: 'Library' },
    { screen: 'search' as Screen, icon: Search, label: 'Search' },
    { screen: 'about' as Screen, icon: Info, label: 'About Artist' },
    { screen: 'themes' as Screen, icon: Palette, label: 'Themes' },
    { screen: 'settings' as Screen, icon: Settings, label: 'Settings' },
    { screen: 'support' as Screen, icon: Heart, label: 'Support' },
    { screen: 'contact' as Screen, icon: MessageCircle, label: 'Contact' },
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold neon-glow">MVRIO Night</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(({ screen, icon: Icon, label }) => (
          <Button
            key={screen}
            variant={currentScreen === screen ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => handleNavigate(screen)}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleInstallClick}
        >
          <Download className="w-5 h-5" />
          Install App
        </Button>
      </div>

      <PWAInstallDialog
        open={showInstallDialog}
        onOpenChange={setShowInstallDialog}
        isInstalled={isInstalled}
      />
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        {content}
      </SheetContent>
    </Sheet>
  );
}
