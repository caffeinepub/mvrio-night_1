/**
 * Utilities for handling backend authorization errors and mapping them
 * to user-friendly messages.
 */

export interface AuthorizationError {
  isAuthError: boolean;
  isAdminRequired: boolean;
  isSignInRequired: boolean;
  message: string;
}

/**
 * Analyzes an error to determine if it's an authorization error
 * and what type of authorization is required.
 */
export function parseAuthorizationError(error: any): AuthorizationError {
  const errorMessage = error?.message || String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for admin-only errors
  const isAdminError =
    lowerMessage.includes('only admins') ||
    lowerMessage.includes('only artists') ||
    lowerMessage.includes('admin access') ||
    lowerMessage.includes('admins/artists');

  // Check for sign-in required errors
  const isSignInError =
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('only users can') ||
    lowerMessage.includes('authentication required') ||
    lowerMessage.includes('sign in required');

  const isAuthError = isAdminError || isSignInError;

  let message = 'An error occurred';
  if (isAdminError) {
    message = 'Admin access required';
  } else if (isSignInError) {
    message = 'Please sign in to continue';
  } else if (isAuthError) {
    message = 'Authorization required';
  } else {
    message = errorMessage;
  }

  return {
    isAuthError,
    isAdminRequired: isAdminError,
    isSignInRequired: isSignInError && !isAdminError,
    message,
  };
}

/**
 * Gets a user-friendly error message for display in toasts/dialogs.
 */
export function getAuthErrorMessage(error: any): string {
  const parsed = parseAuthorizationError(error);
  return parsed.message;
}

/**
 * Checks if an error is an admin-only authorization error.
 * Used to prevent retry loops for signed-in non-admin users.
 */
export function isAdminOnlyError(error: any): boolean {
  const parsed = parseAuthorizationError(error);
  return parsed.isAdminRequired;
}

/**
 * Checks if an error requires sign-in (but not admin).
 * Used to trigger soft sign-in modal for guest users.
 */
export function isSignInRequiredError(error: any): boolean {
  const parsed = parseAuthorizationError(error);
  return parsed.isSignInRequired;
}
