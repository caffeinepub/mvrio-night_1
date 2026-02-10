export function getAuthErrorMessage(error: any): string {
  const errorMessage = error?.message || String(error);
  
  // Check for missing passcode in session (frontend error)
  if (errorMessage.includes('Admin passcode not found')) {
    return 'Admin passcode not found. Please re-enable Admin Mode to restore your session.';
  }
  
  // Check for invalid passcode from backend
  if (errorMessage.includes('Invalid admin passcode')) {
    return 'Invalid admin passcode. Please check your passcode and try again.';
  }
  
  // Check for admin mode disabled (frontend check failed)
  if (errorMessage.includes('You do not have permission to perform this action')) {
    return 'Admin permission required. Please enable Hidden Admin Mode.';
  }
  
  // Check for backend admin-only errors (should not happen if frontend checks work)
  if (errorMessage.includes('Only admins') || 
      errorMessage.includes('Hidden Admin Mode must be enabled')) {
    return 'Admin permission required. Please enable Hidden Admin Mode.';
  }
  
  // User authentication errors
  if (errorMessage.includes('Only users') || 
      errorMessage.includes('Only signed-in users') ||
      errorMessage.includes('Unauthorized')) {
    return 'Please sign in to continue.';
  }
  
  // Generic fallback
  return 'An error occurred. Please try again.';
}

export function isSignInRequiredError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  
  // Exclude all admin-related errors
  if (errorMessage.includes('admin') || 
      errorMessage.includes('passcode') ||
      errorMessage.includes('Hidden Admin Mode') ||
      errorMessage.includes('You do not have permission')) {
    return false;
  }
  
  return errorMessage.includes('Only users') || 
         errorMessage.includes('Only signed-in users') ||
         errorMessage.includes('Unauthorized');
}

export function isAdminPasscodeError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  
  return errorMessage.includes('Invalid admin passcode') ||
         errorMessage.includes('Admin passcode not found');
}

export function isAdminRequiredError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  
  return errorMessage.includes('Only admins') ||
         errorMessage.includes('Hidden Admin Mode must be enabled') ||
         errorMessage.includes('Invalid admin passcode') ||
         errorMessage.includes('Admin passcode not found') ||
         errorMessage.includes('You do not have permission to perform this action');
}
