import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Calculate proper bottom padding for Android
  const bottomPadding = Platform.select({
    ios: insets.bottom || 0,
    android: Math.max(insets.bottom, 8), // Ensure minimum padding on Android
  });

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? Colors.primary.main : '#9CA3AF';
    const size = 24;
    
    switch (routeName) {
      case 'Home':
        return <Ionicons name="home" size={size} color={color} />;
      case 'Promo':
        return <MaterialIcons name="local-offer" size={size} color={color} />;
      case 'Services':
        return <FontAwesome5 name="paw" size={size} color={color} />;
      case 'Activity':
        return <MaterialIcons name="history" size={size} color={color} />;
      case 'Profile':
        return <Ionicons name="person" size={size} color={color} />;
      default:
        return <Ionicons name="ellipse-outline" size={size} color={color} />;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Promo':
        return 'Promo';
      case 'Services':
        return 'Jasa';
      case 'Activity':
        return 'Activity';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View 
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          // Fixed height to prevent icon cropping
          height: Platform.select({
            ios: 65 + bottomPadding,
            android: 60 + bottomPadding,
          }),
        }
      ]}
    >
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                {getIcon(route.name, isFocused)}
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
              <Text
                style={[
                  styles.label,
                  { 
                    color: isFocused ? Colors.primary.main : '#9CA3AF',
                    fontFamily: isFocused ? Typography.fontFamily.semibold : Typography.fontFamily.regular,
                  }
                ]}
                numberOfLines={1}
              >
                {getLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    minHeight: 50,
  },
  iconWrapper: {
    position: 'relative',
    padding: Spacing.xs,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: `${Colors.primary.main}15`,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.main,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default CustomTabBar;