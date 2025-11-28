import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function goToCart() {
  if (navigationRef.isReady()) {
    // Navigate to the Home tab first, then to Cart screen
    navigationRef.navigate('Home' as never, {
      screen: 'Cart'
    } as never);
  }
}

/**
 * Navigate to login screen
 * @param message - Optional message to show on login screen
 */
export function navigateToLogin(message?: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Auth' as never, {
      screen: 'Login',
      params: { message }
    } as never);
  }
}

/**
 * Navigate to main app tabs
 * @param tab - Tab to navigate to (optional)
 */
export function navigateToMain(tab?: 'Home' | 'Promo' | 'Services' | 'Activity' | 'Profile') {
  if (navigationRef.isReady()) {
    if (tab) {
      navigationRef.navigate('Main' as never, {
        screen: tab
      } as never);
    } else {
      navigationRef.navigate('Main' as never);
    }
  }
}

/**
 * Reset navigation to main app (clears stack)
 * @param tab - Tab to navigate to (optional)
 */
export function resetToMain(tab?: 'Home' | 'Promo' | 'Services' | 'Activity' | 'Profile') {
  if (navigationRef.isReady()) {
    if (tab) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Main' as never, params: { screen: tab } as never }]
      } as never);
    } else {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Main' as never }]
      } as never);
    }
  }
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}

/**
 * Get current navigation state (for debugging)
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}