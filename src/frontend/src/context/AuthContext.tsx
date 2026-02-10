import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  createElement,
} from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Screen } from '../App';

export type PendingActionType =
  | 'like'
  | 'unlike'
  | 'create-playlist'
  | 'add-to-playlist'
  | 'offline-cache'
  | 'device-download';

export interface PendingAction {
  type: PendingActionType;
  songId?: bigint;
  playlistName?: string;
  audioUrl?: string;
  songTitle?: string;
}

export interface LoginReturnPath {
  screen: Screen;
  scrollY: number;
}

export interface AuthContextValue {
  /** Derived from Internet Identity - true when user has valid identity */
  isAuthenticated: boolean;
  
  /** Open the soft sign-in modal and capture pending action */
  requireAuth: (action: PendingAction, returnPath?: LoginReturnPath) => void;
  
  /** Current pending action waiting for auth */
  pendingAction: PendingAction | null;
  
  /** Clear pending action (after successful execution or cancellation) */
  clearPendingAction: () => void;
  
  /** Execute the pending action (called by usePendingAction hook) */
  executePendingAction: () => Promise<void>;
  
  /** Sign-in modal open state */
  isSignInModalOpen: boolean;
  
  /** Close sign-in modal */
  closeSignInModal: () => void;
  
  /** Captured return path */
  returnPath: LoginReturnPath | null;
  
  /** Restore scroll position */
  restoreScrollPosition: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function AuthProvider({ children, currentScreen, onNavigate }: AuthProviderProps) {
  const { identity, loginStatus } = useInternetIdentity();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [returnPath, setReturnPath] = useState<LoginReturnPath | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [hasExecutedPendingAction, setHasExecutedPendingAction] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const requireAuth = useCallback(
    (action: PendingAction, customReturnPath?: LoginReturnPath) => {
      if (isAuthenticated) {
        // Already authenticated, no need to show modal
        return;
      }

      // Capture current state
      const capturedPath: LoginReturnPath = customReturnPath || {
        screen: currentScreen,
        scrollY: window.scrollY,
      };

      setPendingAction(action);
      setReturnPath(capturedPath);
      setIsSignInModalOpen(true);
      setHasExecutedPendingAction(false);
    },
    [isAuthenticated, currentScreen]
  );

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setHasExecutedPendingAction(false);
  }, []);

  const closeSignInModal = useCallback(() => {
    setIsSignInModalOpen(false);
    // Note: We preserve pendingAction in case user wants to try again
    // It will be cleared on successful execution or manual clear
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (returnPath) {
      // Restore screen if different
      if (returnPath.screen !== currentScreen) {
        onNavigate(returnPath.screen);
      }
      // Restore scroll position after a brief delay to allow DOM to update
      setTimeout(() => {
        window.scrollTo({ top: returnPath.scrollY, behavior: 'smooth' });
      }, 100);
    }
  }, [returnPath, currentScreen, onNavigate]);

  const executePendingAction = useCallback(async () => {
    // This is a placeholder - actual execution happens in usePendingAction hook
    // This function exists to provide a centralized execution point
    if (!pendingAction) {
      return;
    }
    // The usePendingAction hook will handle the actual execution
    // After execution, it should call clearPendingAction()
  }, [pendingAction]);

  // Auto-close modal and prepare for retry when login succeeds
  useEffect(() => {
    if (loginStatus === 'success' && isSignInModalOpen) {
      setIsSignInModalOpen(false);
      // Restore scroll position after successful login
      restoreScrollPosition();
      // The pending action will be executed by usePendingAction hook
      // which monitors isAuthenticated state
    }
  }, [loginStatus, isSignInModalOpen, restoreScrollPosition]);

  // Reset execution flag when pending action changes
  useEffect(() => {
    if (pendingAction) {
      setHasExecutedPendingAction(false);
    }
  }, [pendingAction]);

  const value: AuthContextValue = {
    isAuthenticated,
    requireAuth,
    pendingAction,
    clearPendingAction,
    executePendingAction,
    isSignInModalOpen,
    closeSignInModal,
    returnPath,
    restoreScrollPosition,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
