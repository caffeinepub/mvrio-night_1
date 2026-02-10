import {
  createContext,
  useContext,
  type ReactNode,
  createElement,
} from 'react';
import { useHiddenAdminMode } from './HiddenAdminModeContext';

export interface AdminContextValue {
  /** True if Hidden Admin Mode is enabled, false otherwise */
  isAdmin: boolean;
  
  /** Always false for Hidden Admin Mode (no loading state) */
  isLoading: boolean;
  
  /** Always true for Hidden Admin Mode (no async fetch) */
  isFetched: boolean;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function useAdminContext(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { isAdminModeEnabled } = useHiddenAdminMode();

  const value: AdminContextValue = {
    isAdmin: isAdminModeEnabled,
    isLoading: false,
    isFetched: true,
  };

  return createElement(AdminContext.Provider, { value }, children);
}
