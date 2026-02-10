import { type ReactNode } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminOnlyProps {
  children: ReactNode;
  /** Fallback to render when user is not admin (optional) */
  fallback?: ReactNode;
  /** Show disabled state instead of hiding (optional) */
  showDisabled?: boolean;
  /** Tooltip message for disabled state */
  disabledMessage?: string;
}

/**
 * Wrapper component that conditionally renders children based on admin status.
 * Can either hide content, show disabled state, or render a custom fallback.
 */
export function AdminOnly({
  children,
  fallback = null,
  showDisabled = false,
  disabledMessage = 'You do not have permission to perform this action.',
}: AdminOnlyProps) {
  const { isAdmin } = useAdminContext();

  // If user is admin, render children normally
  if (isAdmin) {
    return <>{children}</>;
  }

  // If showDisabled is true, wrap children in disabled state with tooltip
  if (showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <div className="pointer-events-none opacity-50">
                {children}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Otherwise, render fallback (or nothing)
  return <>{fallback}</>;
}

interface AdminGateProps {
  children: ReactNode;
}

/**
 * Simple gate that only renders children for admin users.
 * Non-admin users see nothing.
 */
export function AdminGate({ children }: AdminGateProps) {
  const { isAdmin } = useAdminContext();

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
