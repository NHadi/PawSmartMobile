import { Alert } from 'react-native';
import navigationService from '../services/navigationService';

/**
 * Centralized authentication error handler
 * Handles 401 errors consistently across the app with automatic login redirects
 */

export interface AuthErrorHandlerOptions {
  /** Navigation callback for manual navigation (optional) */
  onNavigateToLogin?: () => void;
  /** Custom message for showing alerts (optional) */
  message?: string;
  /** Whether to show an alert to user (default: false) */
  showAlert?: boolean;
}

/**
 * Handle authentication errors (401) gracefully
 * @param error - Error object from API call
 * @param options - Configuration options for error handling
 */
export function handleAuthError(
  error: any,
  options: AuthErrorHandlerOptions = {}
): void {
  const { onNavigateToLogin, message, showAlert = false } = options;

  console.log('[AuthErrorHandler] Handling authentication error:', error);

  // Check if it's a 401 Unauthorized error
  const is401Error =
    error?.response?.status === 401 ||
    error?.status === 401 ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Please login again') ||
    error?.message?.includes('401');

  if (!is401Error) {
    // Not an auth error, don't handle it here
    return;
  }

  // Navigate to login screen
  navigateToLogin(onNavigateToLogin);

  // Optionally show alert (default to false for seamless UX)
  if (showAlert && message) {
    Alert.alert(
      'Session Expired',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            // Additional navigation if needed (backup)
            navigateToLogin(onNavigateToLogin);
          }
        }
      ]
    );
  }
}

/**
 * Navigate to login screen using multiple fallback methods
 */
function navigateToLogin(customNavigation?: () => void): void {
  try {
    // Use custom navigation if provided
    if (customNavigation) {
      customNavigation();
      return;
    }

    // Use navigation service helper
    if (navigationService && navigationService.navigateToLogin) {
      navigationService.navigateToLogin('Please login to continue');
      return;
    }

    // Fallback: try to access navigation directly
    // This is a last resort and may not work in all cases
    console.warn('[AuthErrorHandler] Navigation service not available, please provide custom navigation');
  } catch (error) {
    console.error('[AuthErrorHandler] Navigation failed:', error);
    // At least log the error so we know what happened
  }
}

/**
 * Create an auth error wrapper for async functions
 * @param asyncFunction - Async function that might throw auth errors
 * @param options - Auth error handling options
 * @returns Wrapped function that handles auth errors
 */
export function withAuthErrorHandler<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  options: AuthErrorHandlerOptions = {}
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFunction(...args);
    } catch (error: any) {
      // Check if it's an authentication error
      const is401Error =
        error?.response?.status === 401 ||
        error?.status === 401 ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('Please login again') ||
        error?.message?.includes('401');

      if (is401Error) {
        handleAuthError(error, options);
        return null; // Return null for graceful handling
      }

      // Re-throw non-auth errors
      throw error;
    }
  };
}

/**
 * Higher-order component wrapper for handling auth errors in API calls
 * @param apiCall - API call function
 * @param options - Auth error handling options
 * @returns Promise that handles auth errors gracefully
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: AuthErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error: any) {
    // Check if it's an authentication error
    const is401Error =
      error?.response?.status === 401 ||
      error?.status === 401 ||
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('Please login again') ||
      error?.message?.includes('401');

    if (is401Error) {
      handleAuthError(error, options);
      return null;
    }

    // Re-throw non-auth errors
    throw error;
  }
}

/**
 * Check if an error is an authentication error
 * @param error - Error object to check
 * @returns True if it's a 401 auth error
 */
export function isAuthError(error: any): boolean {
  return !!(
    error?.response?.status === 401 ||
    error?.status === 401 ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Please login again') ||
    error?.message?.includes('401')
  );
}

export default {
  handleAuthError,
  withAuthErrorHandler,
  safeApiCall,
  isAuthError,
  navigateToLogin,
};