import {
  createContext,
  useContext,
  type ReactNode,
  createElement,
} from 'react';
import { useIsAdmin } from '../hooks/useIsAdmin';

export interface AdminContextValue {
  /** True if current user is admin/artist, false for guests and normal users */
  isAdmin: boolean;
  
  /** True while checking admin status */
  isLoading: boolean;
  
  /** True after admin check has completed */
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
  const { isAdmin, isLoading, isFetched } = useIsAdmin();

  const value: AdminContextValue = {
    isAdmin,
    isLoading,
    isFetched,
  };

  return createElement(AdminContext.Provider, { value }, children);
}
