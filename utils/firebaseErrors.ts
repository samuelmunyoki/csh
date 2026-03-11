// Firebase error code to user-friendly message mapping
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || '';
  
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address. Please check and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered. Please use a different email or sign in.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters with letters and numbers.',
    'auth/operation-not-allowed': 'Sign up is currently disabled. Please try again later.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/internal-error': 'An internal error occurred. Please try again later.',
  };

  // Check if it's a known error code
  if (errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check if error message contains known patterns
  const message = error?.message || errorCode || '';
  
  if (message.includes('already exists')) {
    return 'This email is already registered.';
  }
  
  if (message.includes('INVALID_PASSWORD')) {
    return 'Incorrect password. Please try again.';
  }

  if (message.includes('INVALID_EMAIL')) {
    return 'Invalid email address.';
  }

  if (message.includes('USER_DISABLED')) {
    return 'This account has been disabled.';
  }

  if (message.includes('network')) {
    return 'Network error. Please check your connection.';
  }

  // Return generic message if we can't identify the error
  return message || 'An error occurred. Please try again.';
};

export const isNetworkError = (error: any): boolean => {
  const message = error?.message || '';
  const code = error?.code || '';
  
  return (
    code === 'auth/network-request-failed' ||
    message.includes('network') ||
    message.includes('Network') ||
    message.includes('Failed to fetch') ||
    message.includes('timeout')
  );
};

export const isAuthError = (error: any): boolean => {
  const code = error?.code || '';
  return code.startsWith('auth/');
};
