import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Screen } from '../App';

export type PendingActionType =
  | 'like'
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

interface AuthContextValue {
  isAuthenticated: boolean;
  requireAuth: (action: PendingAction) => void;
  isSignInModalOpen: boolean;
  closeSignInModal: () => void;
  pendingAction: PendingAction | null;
  clearPendingAction: () => void;
  returnPath: { screen: Screen; scrollY: number } | null;
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
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [returnPath, setReturnPath] = useState<{ screen: Screen; scrollY: number } | null>(null);

  const requireAuth = useCallback(
    (action: PendingAction) => {
      // Capture current scroll position
      const scrollY = window.scrollY;
      setReturnPath({ screen: currentScreen, scrollY });
      
      // Store pending action
      setPendingAction(action);
      
      // Open sign-in modal
      setIsSignInModalOpen(true);
    },
    [currentScreen]
  );

  const closeSignInModal = useCallback(() => {
    setIsSignInModalOpen(false);
  }, []);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setReturnPath(null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    requireAuth,
    isSignInModalOpen,
    closeSignInModal,
    pendingAction,
    clearPendingAction,
    returnPath,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
