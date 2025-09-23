import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import SplashScreen from '../screens/SplashScreen';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = (message: string = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
      {children}
      <Modal
        visible={isLoading}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
      >
        <SplashScreen />
      </Modal>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}