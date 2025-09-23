import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  StatusBar,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PawLogo from './PawLogo';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

export default function LoadingScreen({ 
  message = 'Loading...', 
  showProgress = true 
}: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Animated values for floating circles
  const circle1Y = useRef(new Animated.Value(0)).current;
  const circle2Y = useRef(new Animated.Value(0)).current;
  const circle3Y = useRef(new Animated.Value(0)).current;
  
  // Loading dots animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle rotation animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating circles animation
    const animateCircle = (animValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -20,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 20,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCircle(circle1Y, 0);
    animateCircle(circle2Y, 500);
    animateCircle(circle3Y, 1000);

    // Loading dots animation
    const animateDot = (dotValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotValue, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dotValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (showProgress) {
      animateDot(dot1, 0);
      animateDot(dot2, 200);
      animateDot(dot3, 400);
    }
  }, [showProgress]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#FFF5E6', '#FFFFFF', '#E3F2FD', '#B3E5FC']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      />

      {/* Floating Blur Circles */}
      <Animated.View
        style={[
          styles.blurCircle,
          styles.blurCircle1,
          {
            transform: [{ translateY: circle1Y }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFE082', '#FFCA28']}
          style={styles.circleGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blurCircle,
          styles.blurCircle2,
          {
            transform: [{ translateY: circle2Y }],
          },
        ]}
      >
        <LinearGradient
          colors={['#81D4FA', '#4FC3F7']}
          style={styles.circleGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blurCircle,
          styles.blurCircle3,
          {
            transform: [{ translateY: circle3Y }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFCC80', '#FFA726']}
          style={styles.circleGradient}
        />
      </Animated.View>

      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        {/* Professional Paw Logo */}
        <View style={styles.pawContainer}>
          <PawLogo size={140} />
        </View>
      </Animated.View>

      {/* Loading Message and Dots */}
      {showProgress && (
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.loadingText}>{message}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot1,
                  transform: [
                    {
                      scale: dot1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot2,
                  transform: [
                    {
                      scale: dot2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot3,
                  transform: [
                    {
                      scale: dot3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  // Blur Circles
  blurCircle: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  blurCircle1: {
    width: 150,
    height: 150,
    top: height * 0.1,
    right: -30,
    opacity: 0.4,
  },
  blurCircle2: {
    width: 200,
    height: 200,
    top: height * 0.5,
    left: -50,
    opacity: 0.3,
  },
  blurCircle3: {
    width: 120,
    height: 120,
    bottom: height * 0.15,
    right: width * 0.2,
    opacity: 0.35,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  
  // Logo
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pawContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#039BE5',
    marginHorizontal: 5,
  },
});