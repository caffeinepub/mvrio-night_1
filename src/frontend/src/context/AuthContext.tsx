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

export type PendingActionType = 'like' | 'favorites' | 'create-playlist' | 'add-to-playlist' | 'offline-cache' | 'device-download' | 'messaging' | 'playlist-favorites';

export interface PendingAction {
  type: PendingActionType;
  songId?: bigint;
  playlistName?: string;
  audioUrl?: string;
  songTitle?: string;
}

interface ReturnPath {
  screen: Screen;
  scrollY: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  pendingAction: PendingAction | null;
  isSignInModalOpen: boolean;
  returnPath: ReturnPath | null;
  requireAuth: (action: PendingAction) => void;
  clearPendingAction: () => void;
  closeSignInModal: () => void;
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
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [returnPath, setReturnPath] = useState<ReturnPath | null>(null);

  // Compute isAuthenticated from Internet Identity state
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const requireAuth = useCallback((action: PendingAction) => {
    // Only open modal if truly not authenticated
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setPendingAction(action);
      setReturnPath({
        screen: currentScreen,
        scrollY: window.scrollY,
      });
      setIsSignInModalOpen(true);
    }
  }, [currentScreen, identity]);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setReturnPath(null);
  }, []);

  const closeSignInModal = useCallback(() => {
    setIsSignInModalOpen(false);
  }, []);

  // Auto-close modal when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && isSignInModalOpen) {
      // Close modal after successful authentication
      setIsSignInModalOpen(false);
    }
  }, [isAuthenticated, isSignInModalOpen]);

  // Clear pending action when user logs out
  useEffect(() => {
    if (!isAuthenticated && pendingAction) {
      clearPendingAction();
    }
  }, [isAuthenticated, pendingAction, clearPendingAction]);

  const value: AuthContextValue = {
    isAuthenticated,
    pendingAction,
    isSignInModalOpen,
    returnPath,
    requireAuth,
    clearPendingAction,
    closeSignInModal,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
