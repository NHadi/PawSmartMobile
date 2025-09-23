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