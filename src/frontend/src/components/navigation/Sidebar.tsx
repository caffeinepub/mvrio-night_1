import { Home, User, Palette, Settings, Coffee, Mail, Download, LogIn, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Menu } from 'lucide-react';
import { useA2HS } from '../../hooks/useA2HS';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useProfileHelpers } from '../../hooks/useUserProfile';
import type { Screen } from '../../App';
import { useState } from 'react';
import { toast } from 'sonner';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { promptInstall, canInstall } = useA2HS();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { profile, listeningTimeFormatted, isLoading: profileLoading } = useProfileHelpers();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { id: 'home' as Screen, label: 'Home', icon: Home },
    { id: 'about' as Screen, label: 'About the Artist', icon: User },
    { id: 'themes' as Screen, label: 'Themes', icon: Palette },
    { id: 'settings' as Screen, label: 'Settings', icon: Settings },
    { id: 'support' as Screen, label: 'Support', icon: Coffee },
    { id: 'contact' as Screen, label: 'Send a Message', icon: Mail },
  ];

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    setOpen(false);
  };

  const handleInstallApp = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      toast.error('App is already installed or installation is not supported.');
    }
    setOpen(false);
  };

  const handleAuth = async () => {
    if (identity) {
      await clear();
    } else {
      await login();
    }
    setOpen(false);
  };

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

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
          
          {isAuthenticated && profile && !profileLoading && (
            <>
              <Separator className="my-4" />
              <div className="px-2 py-2">
                <Card className="bg-accent/50">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Account</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><strong>Name:</strong> {profile.fullName}</p>
                      <p><strong>Username:</strong> {profile.userName}</p>
                      <p><strong>DOB:</strong> {profile.dateOfBirth}</p>
                      <div className="flex items-center gap-1 pt-1">
                        <Clock className="w-3 h-3" />
                        <span><strong>Listening Time:</strong> {listeningTimeFormatted}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          <div className="pt-4 border-t border-border/50 mt-4 space-y-1">
            <Button
              variant="outline"
              className="w-full justify-start dark:!text-white dark:hover:bg-white/10"
              onClick={handleInstallApp}
            >
              <Download className="w-4 h-4 mr-3" />
              Install App
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start dark:!text-white dark:hover:bg-white/10"
              onClick={handleAuth}
              disabled={isLoggingIn}
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-3" />
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </>
              )}
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
        <div className="sticky top-0 h-screen overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
