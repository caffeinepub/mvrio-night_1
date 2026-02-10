import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useHasUnreadMessages } from '../../hooks/useMessaging';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface AppHeaderProps {
  onOpenMessages?: () => void;
}

export function AppHeader({ onOpenMessages }: AppHeaderProps) {
  const { hasUnread, isLoading: unreadLoading } = useHasUnreadMessages();
  const { identity } = useInternetIdentity();
  
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const showUnreadDot = isAuthenticated && !unreadLoading && hasUnread;

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-card flex items-center justify-center">
          <img 
            src="/assets/icon-192.png" 
            alt="MVRIO logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold neon-glow">MVRIO Night</h1>
          <p className="text-xs text-muted-foreground">Premium Music Experience</p>
        </div>
        
        <div className="flex items-center gap-2">
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
