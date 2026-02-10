import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';
import { useActor } from '../hooks/useActor';

interface HiddenAdminModeContextValue {
  isAdminModeEnabled: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  enableAdminMode: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  disableAdminMode: () => void;
  getPasscode: () => string | null;
}

const HiddenAdminModeContext = createContext<HiddenAdminModeContextValue | undefined>(undefined);

export function useHiddenAdminMode(): HiddenAdminModeContextValue {
  const context = useContext(HiddenAdminModeContext);
  if (!context) {
    throw new Error('useHiddenAdminMode must be used within HiddenAdminModeProvider');
  }
  return context;
}

const STORAGE_KEY = 'hiddenAdminMode';

interface HiddenAdminModeProviderProps {
  children: ReactNode;
}

export function HiddenAdminModeProvider({ children }: HiddenAdminModeProviderProps) {
  const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { actor } = useActor();

  // Initialize from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIsAdminModeEnabled(true);
    }
  }, []);

  // Listen for Ctrl+Shift+U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const enableAdminMode = useCallback(async (passcode: string): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: 'Backend not ready. Please try again.' };
    }

    try {
      // Verify passcode with backend
      await actor.verifyAdminPasscodeForHiddenAdminMode(passcode);
      
      // If verification succeeds, store and enable
      sessionStorage.setItem(STORAGE_KEY, passcode);
      setIsAdminModeEnabled(true);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes('Invalid admin passcode')) {
        return { success: false, error: 'Incorrect passcode' };
      }
      
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }, [actor]);

  const disableAdminMode = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdminModeEnabled(false);
  }, []);

  const getPasscode = useCallback((): string | null => {
    return sessionStorage.getItem(STORAGE_KEY);
  }, []);

  const value: HiddenAdminModeContextValue = {
    isAdminModeEnabled,
    isModalOpen,
    openModal,
    closeModal,
    enableAdminMode,
    disableAdminMode,
    getPasscode,
  };

  return createElement(HiddenAdminModeContext.Provider, { value }, children);
}
