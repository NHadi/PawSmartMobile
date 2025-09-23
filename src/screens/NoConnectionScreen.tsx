import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

interface NoConnectionScreenProps {
  onRetry?: () => void;
}

// Import the Connection Maskot - using no-space version
const connectionMascot = require('../../assets/ConnectionMaskot.png');

export default function NoConnectionScreen({ onRetry }: NoConnectionScreenProps) {
  const handleRetry = async () => {
    // Check network state
    const state = await NetInfo.fetch();
    
    if (state.isConnected && onRetry) {
      onRetry();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Layer */}
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Content Layer - Above background and overlay */}
      <View style={styles.mainContent}>
        {/* Connection Mascot with Wi-Fi indicator */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../assets/ConnectionMaskot.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Error Message */}
        <Text style={styles.errorTitle}>Gagal memuat</Text>
        <Text style={styles.errorMessage}>
          Pastikan perangkat Anda terhubung ke Internet
        </Text>

        {/* Retry Button */}
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A6D9',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 166, 217, 0.85)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mascotContainer: {
    width: 250,
    height: 250,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  debugContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 5,
  },
  debugImage: {
    width: 100,
    height: 100,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: '#16A6D9',
    letterSpacing: 0.5,
  },
});