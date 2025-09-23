import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import NoConnectionScreen from '../screens/NoConnectionScreen';

interface NetworkMonitorProps {
  children: React.ReactNode;
}

export default function NetworkMonitor({ children }: NetworkMonitorProps) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
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
    });
  };

  if (!isConnected) {
    return <NoConnectionScreen onRetry={handleRetry} />;
  }

  return <>{children}</>;
}