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
import DebugPanel from './src/components/DebugPanel';
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
        // Test HTTP/HTTPS connectivity for debugging
        console.log('🔍 Testing network connectivity...');

        const networkResults = [];

        try {
          // Test basic HTTP connectivity
          const httpTest = await fetch('http://httpbin.org/get', {
            method: 'GET',
            timeout: 5000,
          });
          console.log('✅ HTTP test successful:', httpTest.status);
          networkResults.push(`HTTP Test: ✅ ${httpTest.status}`);

          // Test Odoo server connectivity (HTTP)
          const odooTest = await fetch('http://103.67.244.254:8069', {
            method: 'GET',
            timeout: 10000,
          });
          console.log('✅ Odoo server accessible:', odooTest.status);
          networkResults.push(`Odoo Server: ✅ ${odooTest.status}`);

          // Test Fonnte API connectivity (HTTPS)
          const fonnteTest = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.EXPO_PUBLIC_FONNTE_TOKEN || 'test-token'
            },
            body: JSON.stringify({
              target: '081234567890',
              message: 'test',
              countryCode: '62'
            }),
            timeout: 10000,
          });
          console.log('✅ Fonnte API accessible:', fonnteTest.status, fonnteTest.statusText);
          networkResults.push(`Fonnte API: ✅ ${fonnteTest.status} ${fonnteTest.statusText}`);
        } catch (httpError) {
          console.error('❌ Network connectivity test failed:', httpError.message);
          console.error('Network error details:', httpError);
          networkResults.push(`Network Error: ❌ ${httpError.message}`);
        }

        // Show network test results in development builds
        if (process.env.EXPO_PUBLIC_DEBUG === 'true') {
          setTimeout(() => {
            Alert.alert(
              'Network Connectivity Test',
              networkResults.join('\n\n'),
              [{ text: 'OK' }]
            );
          }, 3000); // Show after 3 seconds
        }

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
                <DebugPanel />
              </LoadingProvider>
            </CartProvider>
          </AuthProvider>
        </NetworkMonitor>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
