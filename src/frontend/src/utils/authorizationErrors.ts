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

  // Check for admin passcode errors specifically
  const isPasscodeError =
    lowerMessage.includes('invalid admin passcode') ||
    lowerMessage.includes('admin passcode not found') ||
    lowerMessage.includes('admin passcode not available');

  // Check for other admin-required errors
  const isAdminRequired =
    isPasscodeError ||
    lowerMessage.includes('only admin') ||
    (lowerMessage.includes('unauthorized') && lowerMessage.includes('admin')) ||
    (lowerMessage.includes('permission') && !lowerMessage.includes('only users'));

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
  const lowerMessage = authError.message.toLowerCase();

  // Specific message for passcode errors
  if (lowerMessage.includes('passcode')) {
    return 'Invalid or missing admin passcode. Please re-enable Admin Mode.';
  }

  if (authError.isAdminRequired) {
    return 'You do not have admin permission to perform this action.';
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
