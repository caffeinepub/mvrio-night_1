/**
 * DEPRECATED: This hook is no longer used for admin UI gating.
 * Admin status is now determined by Hidden Admin Mode (key combo + passcode).
 * 
 * This file is kept for backward compatibility but should not be used
 * for determining admin UI visibility.
 */

export function useIsAdmin() {
  return {
    isAdmin: false,
    isLoading: false,
    isFetched: true,
  };
}
