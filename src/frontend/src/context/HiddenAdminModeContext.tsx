import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';

interface HiddenAdminModeContextValue {
  isAdminModeEnabled: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  enableAdminMode: (passcode: string) => boolean;
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

const CORRECT_PASSCODE = 'A1B2D3ABD';
const STORAGE_KEY = 'hiddenAdminMode';

interface HiddenAdminModeProviderProps {
  children: ReactNode;
}

export function HiddenAdminModeProvider({ children }: HiddenAdminModeProviderProps) {
  const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === CORRECT_PASSCODE) {
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

  const enableAdminMode = useCallback((passcode: string): boolean => {
    if (passcode === CORRECT_PASSCODE) {
      sessionStorage.setItem(STORAGE_KEY, passcode);
      setIsAdminModeEnabled(true);
      return true;
    }
    return false;
  }, []);

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
