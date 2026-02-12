import { Button } from '@/components/ui/button';
import { Mail, Menu } from 'lucide-react';
import { useGetAdminUnreadCount } from '../../hooks/useMessaging';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';

interface AppHeaderProps {
  onOpenMessages?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({ onOpenMessages, onToggleSidebar, isSidebarOpen }: AppHeaderProps) {
  const { identity } = useInternetIdentity();
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const adminUnreadQuery = useGetAdminUnreadCount();
  
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  
  // Show unread dot if admin mode is enabled and there are unread conversations
  const showUnreadDot = isAuthenticated && isAdminModeEnabled && (adminUnreadQuery.data || 0) > 0;

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            aria-expanded={isSidebarOpen}
            className="shrink-0"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}
        
        <div className="w-10 h-10 rounded-full overflow-hidden bg-card flex items-center justify-center shrink-0">
          <img 
            src="/assets/generated/header-music-note.dim_128x128.png" 
            alt="MVRIO logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold neon-glow truncate">MVRIO Night</h1>
          <p className="text-xs text-muted-foreground truncate">Premium Music Experience</p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && onOpenMessages && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMessages}
              className="relative"
              title="Messages"
            >
              <Mail className="w-5 h-5" />
              {showUnreadDot && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
