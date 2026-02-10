import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';

const ADMIN_PASSCODE = 'A1B2D3ABD';
const STORAGE_KEY_ENABLED = 'mvrio_admin_mode_enabled';
const STORAGE_KEY_PASSCODE = 'mvrio_admin_mode_passcode';

export interface HiddenAdminModeContextValue {
  isAdminModeEnabled: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  submitPasscode: (passcode: string) => boolean;
  clearAdminMode: () => void;
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

interface HiddenAdminModeProviderProps {
  children: ReactNode;
}

export function HiddenAdminModeProvider({ children }: HiddenAdminModeProviderProps) {
  const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load admin mode state from sessionStorage on mount
  useEffect(() => {
    const enabled = sessionStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    const passcode = sessionStorage.getItem(STORAGE_KEY_PASSCODE);
    
    if (enabled && passcode === ADMIN_PASSCODE) {
      setIsAdminModeEnabled(true);
    } else {
      // Clear invalid state
      sessionStorage.removeItem(STORAGE_KEY_ENABLED);
      sessionStorage.removeItem(STORAGE_KEY_PASSCODE);
    }
  }, []);

  // Listen for Ctrl+Shift+U key combo
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

  const submitPasscode = useCallback((passcode: string): boolean => {
    if (passcode === ADMIN_PASSCODE) {
      setIsAdminModeEnabled(true);
      sessionStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      sessionStorage.setItem(STORAGE_KEY_PASSCODE, passcode);
      setIsModalOpen(false);
      return true;
    }
    return false;
  }, []);

  const clearAdminMode = useCallback(() => {
    setIsAdminModeEnabled(false);
    sessionStorage.removeItem(STORAGE_KEY_ENABLED);
    sessionStorage.removeItem(STORAGE_KEY_PASSCODE);
    setIsModalOpen(false);
  }, []);

  const getPasscode = useCallback((): string | null => {
    // Always read from sessionStorage to ensure consistency
    const passcode = sessionStorage.getItem(STORAGE_KEY_PASSCODE);
    const enabled = sessionStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    
    // Only return passcode if admin mode is enabled and passcode is valid
    if (enabled && passcode === ADMIN_PASSCODE) {
      return passcode;
    }
    
    return null;
  }, []);

  const value: HiddenAdminModeContextValue = {
    isAdminModeEnabled,
    isModalOpen,
    openModal,
    closeModal,
    submitPasscode,
    clearAdminMode,
    getPasscode,
  };

  return createElement(HiddenAdminModeContext.Provider, { value }, children);
}
