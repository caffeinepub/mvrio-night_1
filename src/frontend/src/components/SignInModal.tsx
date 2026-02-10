import { LogIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useAuth } from '../context/AuthContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsMobile } from '../hooks/useMediaQuery';

export function SignInModal() {
  const isMobile = useIsMobile();
  const { isSignInModalOpen, closeSignInModal, clearPendingAction } = useAuth();
  const { login, isLoggingIn, clear, identity } = useInternetIdentity();

  const handleSignIn = async () => {
    try {
      // If already authenticated with stale state, clear and retry
      if (identity && !identity.getPrincipal().isAnonymous()) {
        await clear();
        setTimeout(() => {
          login();
        }, 300);
      } else {
        login();
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      // If "already authenticated" error, clear and retry
      if (error.message?.includes('already authenticated')) {
        await clear();
        setTimeout(() => {
          login();
        }, 300);
      }
    }
  };

  const handleCancel = () => {
    closeSignInModal();
    clearPendingAction();
  };

  const content = (
    <>
      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          This feature requires an account. It only takes a moment.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          You won't lose your place.
        </p>
      </div>

      <div className="space-y-3 pt-4">
        <Button
          onClick={handleSignIn}
          disabled={isLoggingIn}
          size="lg"
          className="w-full gap-2"
        >
          {isLoggingIn ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In with Internet Identity
            </>
          )}
        </Button>

        <Button
          onClick={handleCancel}
          disabled={isLoggingIn}
          variant="outline"
          size="lg"
          className="w-full gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isSignInModalOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sign in to continue</DrawerTitle>
            <DrawerDescription className="sr-only">
              Sign in to access restricted features
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isSignInModalOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription className="sr-only">
            Sign in to access restricted features
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
