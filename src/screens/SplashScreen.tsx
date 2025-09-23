import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  ImageBackground,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Text fade in animation
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 1500,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image with Overlay - Same as Login/Register */}
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                ],
              },
            ]}
          >
            {/* App Logo */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/splash-icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textFadeAnim,
              },
            ]}
          >
            <Text style={styles.appName}>PawSmart</Text>
            <Text style={styles.tagline}>Your Pet's Best Friend</Text>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A6D9',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 166, 217, 0.85)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Logo
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 100,
    padding: 20,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  
  // Text
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
});