import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';
import type { Screen } from '../App';

export type PendingActionType = 'like' | 'create-playlist' | 'add-to-playlist' | 'offline-cache' | 'device-download' | 'messaging';

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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [returnPath, setReturnPath] = useState<ReturnPath | null>(null);

  const requireAuth = useCallback((action: PendingAction) => {
    setPendingAction(action);
    setReturnPath({
      screen: currentScreen,
      scrollY: window.scrollY,
    });
    setIsSignInModalOpen(true);
  }, [currentScreen]);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setReturnPath(null);
  }, []);

  const closeSignInModal = useCallback(() => {
    setIsSignInModalOpen(false);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: false,
    pendingAction,
    isSignInModalOpen,
    returnPath,
    requireAuth,
    clearPendingAction,
    closeSignInModal,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
