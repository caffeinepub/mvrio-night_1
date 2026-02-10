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

  // Check for admin-required errors (including passcode-related)
  const isAdminRequired =
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('admin') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('passcode') ||
    lowerMessage.includes('invalid passcode');

  // Check for sign-in-required errors (but not admin-only errors)
  const isSignInRequired =
    !isAdminRequired &&
    (lowerMessage.includes('only users') ||
     lowerMessage.includes('must be authenticated') ||
     lowerMessage.includes('sign in required'));

  const isAuthError = isAdminRequired || isSignInRequired;

  return {
    isAuthError,
    isAdminRequired,
    isSignInRequired,
    message: errorMessage,
  };
}

/**
 * Returns a user-friendly error message for authorization errors.
 * Maps backend errors to consistent frontend messages.
 */
export function getAuthErrorMessage(error: any): string {
  const authError = parseAuthorizationError(error);

  if (authError.isAdminRequired) {
    return 'You do not have permission to perform this action.';
  }

  if (authError.isSignInRequired) {
    return 'Please sign in to perform this action.';
  }

  // Generic error message for non-auth errors
  return error?.message || 'An error occurred. Please try again.';
}

/**
 * Checks if an error is a sign-in-required error (not admin-only).
 * Used to determine whether to trigger the soft sign-in modal.
 */
export function isSignInRequiredError(error: any): boolean {
  const authError = parseAuthorizationError(error);
  return authError.isSignInRequired && !authError.isAdminRequired;
}

/**
 * Checks if an error is an admin-required error.
 * Used to prevent triggering sign-in modal for admin-only actions.
 */
export function isAdminRequiredError(error: any): boolean {
  const authError = parseAuthorizationError(error);
  return authError.isAdminRequired;
}
