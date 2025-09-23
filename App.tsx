import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, Text, ActivityIndicator, Alert } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreenExpo from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { LoadingProvider } from './src/hooks/useLoading';
import NetworkMonitor from './src/components/NetworkMonitor';
import { usePoppinsFonts } from './src/utils/fontLoader';
// Use optimized query client configuration
import { queryClient } from './src/config/queryClient';

// Keep the native splash screen visible while we fetch resources
SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(false);

  // Load Poppins fonts
  const { fontsLoaded, fontError } = usePoppinsFonts();

  useEffect(() => {
    async function prepare() {
      try {

        // Wait for fonts to load
        if (!fontsLoaded && !fontError) {
          return; // Still loading fonts
        }

        if (fontError) {
          console.warn('Font loading error:', fontError);
          // Continue with system fonts if font loading fails
        }

        // Add any other initialization logic here
        // Pre-load any critical data, check auth state, etc.

        // Hide the Expo splash screen
        await SplashScreenExpo.hideAsync();

        // Show our custom splash screen
        setShowCustomSplash(true);

        // Keep custom splash visible for minimum duration
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Ready to show main app
        setAppIsReady(true);

        // Hide custom splash with delay for smooth transition
        setTimeout(() => {
          setShowCustomSplash(false);
        }, 500);

      } catch (error) {
        console.error('App preparation error:', error);
        // Hide splash screens and continue
        await SplashScreenExpo.hideAsync();
        setAppIsReady(true);
        setShowCustomSplash(false);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  // Show custom splash screen during initialization
  if (showCustomSplash) {
    return <SplashScreen />;
  }

  // Don't render anything if app is not ready
  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <NetworkMonitor>
          <AuthProvider>
            <CartProvider>
              <LoadingProvider>
                <StatusBar
                  style="auto"
                  translucent={Platform.OS === 'android'}
                />
                <AppNavigator />
              </LoadingProvider>
            </CartProvider>
          </AuthProvider>
        </NetworkMonitor>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
