import React, { useEffect, useState } from 'react';
import { Modal, Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import NoConnectionScreen from '../screens/NoConnectionScreen';
import apiClient from '../services/api/apiClient';
import config from '../config/environment';

interface NetworkMonitorProps {
  children: React.ReactNode;
}

export default function NetworkMonitor({ children }: NetworkMonitorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkInfo(state);

      // Enhanced logging for APK debugging
      if (config.DEBUG || config.IS_EAS_BUILD) {
        console.log('Network State:', {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
          details: state.details,
        });
      }
    });

    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkInfo(state);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = () => {
    // Re-check network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkInfo(state);
    });
  };

  const testOdooConnection = async () => {
    try {
      const result = await apiClient.testOdooConnection();

      Alert.alert(
        config.IS_EAS_BUILD ? 'APK Odoo Connection Test' : 'Odoo Connection Test',
        result.success ?
          `✅ ${result.message}` :
          `❌ ${result.message}`,
        [
          {
            text: 'Details',
            onPress: () => {
              Alert.alert(
                'Connection Details',
                JSON.stringify(result.details, null, 2)
              );
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Connection Test Failed',
        error.message
      );
    }
  };

  const showNetworkDebugInfo = () => {
    if (!networkInfo) return;

    let debugInfo = `📱 APK Network Debug Info\n\n`;
    debugInfo += `Connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}\n`;
    debugInfo += `Type: ${networkInfo.type}\n`;
    debugInfo += `Internet Reachable: ${networkInfo.isInternetReachable}\n`;
    debugInfo += `EAS Build: ${config.IS_EAS_BUILD ? 'Yes' : 'No'}\n`;
    debugInfo += `Production: ${config.IS_PRODUCTION ? 'Yes' : 'No'}\n`;
    debugInfo += `Odoo URL: ${config.ODOO.BASE_URL}\n`;

    if (networkInfo.details) {
      debugInfo += `\nNetwork Details:\n${JSON.stringify(networkInfo.details, null, 2)}`;
    }

    Alert.alert(
      'Network Debug Info',
      debugInfo,
      [
        { text: 'Test Odoo', onPress: testOdooConnection },
        { text: 'OK' }
      ]
    );
  };

  if (!isConnected) {
    return <NoConnectionScreen onRetry={handleRetry} />;
  }

  return (
    <>
      {children}
      {/* Debug Panel for APK builds */}
      {(config.DEBUG || config.IS_EAS_BUILD) && (
        <View style={styles.debugPanel}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={showNetworkDebugInfo}
          >
            <Text style={styles.debugButtonText}>🔍 Network Debug</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  debugPanel: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
  },
  debugButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});