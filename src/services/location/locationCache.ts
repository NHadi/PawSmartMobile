import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedLocationData } from '../../types/location';

class LocationCache {
  private readonly CACHE_PREFIX = '@location_cache_';
  private readonly DEFAULT_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly POSTAL_CODE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 1 day

  // Memory cache for current session
  private memoryCache = new Map<string, any>();

  /**
   * Generate cache key for different types of location data
   */
  private getCacheKey(type: string, identifier?: string): string {
    return `${this.CACHE_PREFIX}${type}${identifier ? `_${identifier}` : ''}`;
  }

  /**
   * Set data in cache with expiration
   */
  async set(
    type: string,
    data: any,
    identifier?: string,
    customExpireTime?: number
  ): Promise<void> {
    const key = this.getCacheKey(type, identifier);
    const expireTime = customExpireTime || (type === 'postal_codes' ? this.POSTAL_CODE_EXPIRE_TIME : this.DEFAULT_EXPIRE_TIME);

    const cacheData: CachedLocationData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expireTime
    };

    // Store in memory for quick access
    this.memoryCache.set(key, cacheData);

    // Store in persistent storage
    try {
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache location data:', error);
    }
  }

  /**
   * Get data from cache
   */
  async get(type: string, identifier?: string): Promise<any | null> {
    const key = this.getCacheKey(type, identifier);

    // Check memory cache first
    const memoryData = this.memoryCache.get(key);
    if (memoryData && this.isValid(memoryData)) {
      return memoryData.data;
    }

    // Check persistent storage
    try {
      const cachedString = await AsyncStorage.getItem(key);
      if (!cachedString) return null;

      const cachedData: CachedLocationData = JSON.parse(cachedString);

      if (this.isValid(cachedData)) {
        // Update memory cache
        this.memoryCache.set(key, cachedData);
        return cachedData.data;
      } else {
        // Remove expired data
        await this.remove(type, identifier);
        return null;
      }
    } catch (error) {
      console.warn('Failed to get cached location data:', error);
      return null;
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isValid(cachedData: CachedLocationData): boolean {
    return Date.now() < cachedData.expiresAt;
  }

  /**
   * Remove data from cache
   */
  async remove(type: string, identifier?: string): Promise<void> {
    const key = this.getCacheKey(type, identifier);

    // Remove from memory
    this.memoryCache.delete(key);

    // Remove from persistent storage
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached location data:', error);
    }
  }

  /**
   * Clear all location cache
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear persistent storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const locationCacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(locationCacheKeys);
    } catch (error) {
      console.warn('Failed to clear location cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheInfo(): Promise<{
    memorySize: number;
    persistentKeys: number;
    totalSize: string;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const locationCacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      return {
        memorySize: this.memoryCache.size,
        persistentKeys: locationCacheKeys.length,
        totalSize: `${locationCacheKeys.length} items cached`
      };
    } catch (error) {
      return {
        memorySize: this.memoryCache.size,
        persistentKeys: 0,
        totalSize: 'Unable to calculate'
      };
    }
  }

  /**
   * Preload frequently used data
   */
  async preloadEssentials(): Promise<void> {
    // Preload provinces if not cached
    const provinces = await this.get('provinces');
    if (!provinces) {
      console.log('Provinces not cached, will load on first request');
    }
  }
}

export const locationCache = new LocationCache();