import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface LocationSkeletonProps {
  count?: number;
}

const SkeletonLine: React.FC<{ width: string; height?: number }> = ({ width, height = 16 }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        {
          width,
          height,
          opacity,
        },
      ]}
    />
  );
};

export const LocationSkeleton: React.FC<LocationSkeletonProps> = ({ count = 8 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.indicator} />
          <View style={styles.textContainer}>
            <SkeletonLine width="60%" height={18} />
            <View style={styles.spacer} />
            <SkeletonLine width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const LocationListSkeleton: React.FC<LocationSkeletonProps> = ({ count = 10 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonLine width="75%" height={16} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  indicator: {
    width: 4,
    height: 40,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  spacer: {
    height: Spacing.xs,
  },
  skeletonLine: {
    backgroundColor: Colors.border.light,
    borderRadius: 4,
  },
  listItem: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
});