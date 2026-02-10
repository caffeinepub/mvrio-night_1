export function getAuthErrorMessage(error: any): string {
  const errorMessage = error?.message || String(error);
  
  // Admin passcode errors
  if (errorMessage.includes('Invalid admin passcode') || 
      errorMessage.includes('passcode')) {
    return 'Invalid admin passcode. Please check your passcode and try again.';
  }
  
  // Admin permission errors
  if (errorMessage.includes('Only admins') || 
      errorMessage.includes('admin') ||
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
  
  // Only return true for user authentication errors, NOT admin errors
  if (errorMessage.includes('admin') || 
      errorMessage.includes('passcode') ||
      errorMessage.includes('Hidden Admin Mode')) {
    return false;
  }
  
  return errorMessage.includes('Only users') || 
         errorMessage.includes('Only signed-in users') ||
         errorMessage.includes('Unauthorized');
}

export function isAdminPasscodeError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  
  return errorMessage.includes('Invalid admin passcode') ||
         errorMessage.includes('passcode') ||
         errorMessage.includes('Only admins') ||
         errorMessage.includes('Hidden Admin Mode must be enabled');
}

export function isAdminRequiredError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  
  return errorMessage.includes('Only admins') ||
         errorMessage.includes('admin') ||
         errorMessage.includes('Hidden Admin Mode must be enabled') ||
         errorMessage.includes('Invalid admin passcode') ||
         errorMessage.includes('passcode');
}
