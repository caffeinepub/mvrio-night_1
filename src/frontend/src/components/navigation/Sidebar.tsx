import { Home, User, Palette, Settings, Coffee, Music, Mail, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useA2HS } from '../../hooks/useA2HS';
import type { Screen } from '../../App';
import { useState } from 'react';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { promptInstall } = useA2HS();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { id: 'home' as Screen, label: 'Home', icon: Home },
    { id: 'about' as Screen, label: 'About the Artist', icon: User },
    { id: 'themes' as Screen, label: 'Themes', icon: Palette },
    { id: 'settings' as Screen, label: 'Settings', icon: Settings },
    { id: 'support' as Screen, label: 'Support', icon: Coffee },
    { id: 'requests' as Screen, label: 'Custom Song Requests', icon: Music },
    { id: 'contact' as Screen, label: 'Contact', icon: Mail },
  ];

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    setOpen(false);
  };

  const handleA2HS = () => {
    promptInstall();
    setOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start transition-colors ${
                  isActive 
                    ? 'bg-[#1ED760] text-black hover:bg-[#1ED760]/90 dark:bg-[#1ED760] dark:!text-black dark:hover:bg-[#1ED760]/90' 
                    : 'dark:!text-white dark:hover:bg-white/10'
                }`}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
          
          <div className="pt-4 border-t border-border/50 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start dark:!text-white dark:hover:bg-white/10"
              onClick={handleA2HS}
            >
              <Download className="w-4 h-4 mr-3" />
              Add to Home Screen
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b border-border/50">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border/50 bg-sidebar/80 backdrop-blur-sm">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
