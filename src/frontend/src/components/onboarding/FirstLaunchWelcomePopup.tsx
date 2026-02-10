import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Music } from 'lucide-react';

interface FirstLaunchWelcomePopupProps {
  onDismiss: () => void;
}

export function FirstLaunchWelcomePopup({ onDismiss }: FirstLaunchWelcomePopupProps) {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
      onDismiss();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to MVRIO Night</DialogTitle>
          <DialogDescription className="text-center">
            Your premium music experience awaits. Sign in with Internet Identity to get started and unlock all features.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In with Internet Identity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
