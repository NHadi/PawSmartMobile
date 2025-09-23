import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OptimizedProductImageProps {
  imageBase64?: string;
  placeholderImage?: any;
  style?: ImageStyle | ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  lowQuality?: boolean; // Use lower quality image for lists
}

// Simple in-memory cache for the current session
const imageCache = new Map<string, string>();

export default function OptimizedProductImage({
  imageBase64,
  placeholderImage,
  style,
  resizeMode = 'cover',
  lowQuality = false,
}: OptimizedProductImageProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imageBase64) {
        setError(true);
        return;
      }

      // Create a cache key based on image content and quality
      const cacheKey = `img_${lowQuality ? 'low' : 'high'}_${imageBase64.substring(0, 20)}`;

      // Check in-memory cache first
      if (imageCache.has(cacheKey)) {
        if (isMounted) {
          setImageUri(imageCache.get(cacheKey)!);
        }
        return;
      }

      setLoading(true);

      try {
        // Check AsyncStorage cache
        const cachedUri = await AsyncStorage.getItem(cacheKey);
        if (cachedUri && isMounted) {
          setImageUri(cachedUri);
          imageCache.set(cacheKey, cachedUri);
          setLoading(false);
          return;
        }

        // Process image
        let processedImage = imageBase64;
        
        // For low quality, we could resize/compress the image here
        // For now, we'll just use the base64 as-is
        const uri = `data:image/jpeg;base64,${processedImage}`;

        // Cache the result
        imageCache.set(cacheKey, uri);
        
        // Store in AsyncStorage for persistence (with size limit)
        if (imageCache.size < 100) { // Limit cache size
          await AsyncStorage.setItem(cacheKey, uri).catch(() => {
            // Ignore cache write errors
          });
        }

        if (isMounted) {
          setImageUri(uri);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageBase64, lowQuality]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
      </View>
    );
  }

  if (error || !imageUri) {
    if (placeholderImage) {
      return (
        <Image
          source={placeholderImage}
          style={style}
          resizeMode={resizeMode}
        />
      );
    }

    return (
      <View style={[styles.container, styles.placeholder, style]}>
        <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setError(true)}
    />
  );
}

// Cache cleanup utility
export const clearImageCache = async () => {
  imageCache.clear();
  
  // Clear AsyncStorage image cache
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageKeys = keys.filter(key => key.startsWith('img_'));
    await AsyncStorage.multiRemove(imageKeys);
  } catch (error) {
    }
};

// Preload images for better performance
export const preloadImages = async (images: string[]) => {
  const promises = images.map(async (imageBase64) => {
    if (!imageBase64) return;
    
    const cacheKey = `img_high_${imageBase64.substring(0, 20)}`;
    
    if (!imageCache.has(cacheKey)) {
      const uri = `data:image/jpeg;base64,${imageBase64}`;
      imageCache.set(cacheKey, uri);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(cacheKey, uri).catch(() => {
        // Ignore errors
      });
    }
  });

  await Promise.all(promises);
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: Colors.background.secondary,
  },
});