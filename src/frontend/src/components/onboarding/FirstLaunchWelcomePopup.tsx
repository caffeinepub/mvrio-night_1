import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface FirstLaunchWelcomePopupProps {
  onDismiss: () => void;
}

export function FirstLaunchWelcomePopup({ onDismiss }: FirstLaunchWelcomePopupProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  const handleContinueAsGuest = () => {
    onDismiss();
  };

  const handleSignIn = async () => {
    onDismiss();
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Decorative gradient header */}
        <div className="banner-gradient-stars h-24 flex items-center justify-center">
          <Music className="w-12 h-12 text-primary neon-glow" />
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to MVRIO Night
            </h2>
            <p className="text-muted-foreground">
              Discover and enjoy music in a whole new way. Start exploring now or sign in to unlock personalized features.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinueAsGuest}
              variant="outline"
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isLoggingIn}
            >
              Continue as Guest
            </Button>
            
            <Button
              onClick={handleSignIn}
              size="lg"
              className="w-full text-base font-semibold bg-primary hover:bg-primary/90"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
